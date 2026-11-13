const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const express = require('express');

const app = express();
const PORT = Number(process.env.PORT) || 10000;
const EXECUTION_TIMEOUT_MS = 5000;
const COMPILATION_TIMEOUT_MS = 20000;
const MAX_OUTPUT_BYTES = 1024 * 1024;
const MAX_CODE_BYTES = 256 * 1024;
const SUPPORTED_LANGUAGES = new Set(['python', 'cpp', 'java']);

app.disable('x-powered-by');
app.use(express.json({ limit: `${MAX_CODE_BYTES}b`, strict: true }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

function runProcess(command, args, cwd, deadline, input = '') {
  return new Promise((resolve, reject) => {
    const remaining = Math.max(1, deadline - Date.now());
    const child = spawn(command, args, {
      cwd,
      // Do not pass the service's environment (including SANDBOX_SECRET) to student code.
      env: {
        PATH: process.env.PATH || '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
        HOME: cwd,
        TMPDIR: cwd,
        LANG: 'C.UTF-8',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: process.platform !== 'win32',
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let outputBytes = 0;
    let timedOut = false;
    let outputExceeded = false;
    let settled = false;

    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(result);
    };

    const killChild = () => {
      try {
        if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, 'SIGKILL');
        else child.kill('SIGKILL');
      } catch { child.kill('SIGKILL'); }
    };

    const append = (target, chunk) => {
      if (settled) return;
      outputBytes += chunk.length;
      const text = chunk.toString('utf8');
      if (target === 'stdout') stdout += text;
      else stderr += text;
      if (outputBytes > MAX_OUTPUT_BYTES) {
        outputExceeded = true;
        killChild();
      }
    };

    child.stdout.on('data', (chunk) => append('stdout', chunk));
    child.stderr.on('data', (chunk) => append('stderr', chunk));
    child.once('error', (error) => finish(error));

    const timer = setTimeout(() => {
      timedOut = true;
      killChild();
    }, remaining);

    child.stdin.on('error', () => {});
    child.stdin.end(input, 'utf8');

    child.once('close', (exitCode, signal) => {
      finish(null, {
        stdout,
        stderr: outputExceeded ? `${stderr}\n[Output exceeded 1 MB and was stopped.]` : stderr,
        exitCode: exitCode === null ? (timedOut || outputExceeded ? 1 : null) : exitCode,
        timedOut,
        outputExceeded,
        signal,
      });
    });
  });
}

async function execute(language, code, input, workDir) {
  const started = Date.now();
  if (language === 'python') {
    await fs.writeFile(path.join(workDir, 'main.py'), code, { mode: 0o600 });
    const result = await runProcess('python3', ['-I', '-B', 'main.py'], workDir,
      Date.now() + EXECUTION_TIMEOUT_MS, input);
    return { ...result, phase: 'run', durationMillis: Date.now() - started };
  }
  let compilation;
  let executable;
  let javaClassName;
  const compilationDeadline = Date.now() + COMPILATION_TIMEOUT_MS;
  if (language === 'cpp') {
    await fs.writeFile(path.join(workDir, 'main.cpp'), code, { mode: 0o600 });
    compilation = await runProcess('g++', ['-std=c++17', '-O0', '-pipe', 'main.cpp', '-o', 'program'], workDir, compilationDeadline);
    executable = path.join(workDir, 'program');
  } else {
    const classMatch = code.match(/\bpublic\s+(?:(?:abstract|final)\s+)?class\s+([A-Za-z_$][\w$]*)/)
      || code.match(/\bclass\s+(Main)\b/);
    javaClassName = classMatch?.[1] || 'Main';
    await fs.writeFile(path.join(workDir, `${javaClassName}.java`), code, { mode: 0o600 });
    compilation = await runProcess('javac', ['-encoding', 'UTF-8', `${javaClassName}.java`], workDir, compilationDeadline);
    executable = null;
  }
  if (compilation.timedOut || compilation.outputExceeded || compilation.exitCode !== 0) {
    return { ...compilation, phase: 'compile', durationMillis: Date.now() - started };
  }
  const result = language === 'cpp'
    ? await runProcess(executable, [], workDir, Date.now() + EXECUTION_TIMEOUT_MS, input)
    : await runProcess('java', ['-Xms16m', '-Xmx128m', '-cp', workDir, javaClassName], workDir,
      Date.now() + EXECUTION_TIMEOUT_MS, input);
  return { ...result, phase: 'run', durationMillis: Date.now() - started };
}

app.post('/execute', async (req, res) => {
  const expectedSecret = process.env.SANDBOX_SECRET;
  const suppliedSecret = req.get('x-sandbox-secret');
  if (!expectedSecret || !suppliedSecret || suppliedSecret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { language, code, input = '' } = req.body || {};
  if (!SUPPORTED_LANGUAGES.has(language) || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'Provide a supported language and non-empty code.' });
  }
  if (Buffer.byteLength(code, 'utf8') > MAX_CODE_BYTES) {
    return res.status(413).json({ error: 'Code exceeds the 256 KB limit.' });
  }
  if (typeof input !== 'string' || Buffer.byteLength(input, 'utf8') > MAX_CODE_BYTES) {
    return res.status(400).json({ error: 'Input must be text under 256 KB.' });
  }

  const workDir = path.join(os.tmpdir(), crypto.randomUUID());
  try {
    await fs.mkdir(workDir, { mode: 0o700 });
    const result = await execute(language, code, input, workDir);
    return res.json({
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      timedOut: result.timedOut,
      phase: result.phase,
      durationMillis: result.durationMillis,
      ...(result.outputExceeded ? { outputExceeded: true } : {}),
    });
  } catch (error) {
    console.error('Execution service error:', error.message);
    return res.status(500).json({ error: 'The runner could not execute this submission.' });
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch((error) => {
      console.error('Temporary directory cleanup failed:', error.message);
    });
  }
});

app.use((error, _req, res, _next) => {
  if (error?.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
  if (error instanceof SyntaxError) return res.status(400).json({ error: 'Request body must be valid JSON.' });
  console.error('Request error:', error.message);
  return res.status(500).json({ error: 'Unexpected runner error.' });
});

app.listen(PORT, '0.0.0.0', () => console.log(`Sandbox runner listening on ${PORT}`));
