
package debugger.code.agent.system.service;

import debugger.code.agent.system.model.Diagnostic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class CodeExecutionService {

    @Value("${app.execution.docker.image}")
    private String dockerImage;

    @Value("${app.execution.docker.timeout-seconds:5}")
    private long timeoutSeconds;

    @Value("${app.execution.docker.memory:256m}")
    private String memory;

    @Value("${app.execution.docker.cpus:1}")
    private String cpus;

    public ProcessResult run(List<String> command, Path directory, String input) {

        long started = System.nanoTime();
        String containerName = "code-run-" +
                UUID.randomUUID().toString().replace("-", "");

        List<String> dockerCommand = new ArrayList<>(List.of(
                "docker", "run", "--rm",
                "--name", containerName,
                "--network", "none",
                "--memory", memory,
                "--memory-swap", memory,
                "--cpus", cpus,
                "--pids-limit", "64",
                "--cap-drop", "ALL",
                "--security-opt", "no-new-privileges",
                "--read-only",
                "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m",
                "--user", "10001:10001",
                "--workdir", "/workspace",
                "--mount", "type=bind,source=" +
                        directory.toAbsolutePath() + ",target=/workspace",
                "-i", dockerImage
        ));

        for (String argument : command) {
            if (argument.equals(directory.toString()) ||
                    argument.equals(directory.toAbsolutePath().toString())) {
                dockerCommand.add("/workspace");
            } else if (argument.equals("python")) {
                dockerCommand.add("python3");
            } else if (argument.equals("program.exe")) {
                dockerCommand.add("./program");
            } else {
                dockerCommand.add(argument);
            }
        }

        Process process = null;

        try {
            process = new ProcessBuilder(dockerCommand).start();

            Process runningProcess = process;

            Thread outputReader = new Thread(() -> {
                try {
                    runningProcess.getInputStream().transferTo(
                            java.io.OutputStream.nullOutputStream());
                } catch (IOException ignored) {
                }
            });

            java.io.ByteArrayOutputStream stdout =
                    new java.io.ByteArrayOutputStream();
            java.io.ByteArrayOutputStream stderr =
                    new java.io.ByteArrayOutputStream();

            Thread stdoutReader = new Thread(() -> {
                try {
                    runningProcess.getInputStream().transferTo(stdout);
                } catch (IOException ignored) {
                }
            });

            Thread stderrReader = new Thread(() -> {
                try {
                    runningProcess.getErrorStream().transferTo(stderr);
                } catch (IOException ignored) {
                }
            });

            stdoutReader.start();
            stderrReader.start();

            if (input != null && !input.isEmpty()) {
                process.getOutputStream().write(
                        input.getBytes(StandardCharsets.UTF_8));
            }
            process.getOutputStream().close();

            boolean finished = process.waitFor(
                    timeoutSeconds, TimeUnit.SECONDS);

            if (!finished) {
                process.destroyForcibly();
                process.waitFor();

                new ProcessBuilder(
                        "docker", "rm", "-f", containerName
                ).start().waitFor(3, TimeUnit.SECONDS);
            }

            stdoutReader.join(2000);
            stderrReader.join(2000);

            return new ProcessResult(
                    finished,
                    finished ? process.exitValue() : -1,
                    stdout.toString(StandardCharsets.UTF_8),
                    finished ? stderr.toString(StandardCharsets.UTF_8)
                            : "Execution timed out.",
                    TimeUnit.NANOSECONDS.toMillis(
                            System.nanoTime() - started)
            );

        } catch (IOException e) {
            if (process != null) process.destroyForcibly();

            return new ProcessResult(true, -1, "", e.getMessage(),
                    TimeUnit.NANOSECONDS.toMillis(
                            System.nanoTime() - started));

        } catch (InterruptedException e) {
            if (process != null) process.destroyForcibly();
            Thread.currentThread().interrupt();

            return new ProcessResult(false, -1, "",
                    "Execution interrupted",
                    TimeUnit.NANOSECONDS.toMillis(
                            System.nanoTime() - started));
        }
    }

    public Diagnostic unavailable(String tool) {
        return new Diagnostic(
                0, 0,
                tool + " is not installed or is unavailable on the server.",
                "ENVIRONMENT"
        );
    }

    public record ProcessResult(
            boolean finished,
            int exitCode,
            String stdout,
            String stderr,
            long durationMillis
    ) { }
}
