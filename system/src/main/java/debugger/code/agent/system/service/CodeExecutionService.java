package debugger.code.agent.system.service;

import debugger.code.agent.system.model.Diagnostic;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class CodeExecutionService {
    // Stops accidental infinite loops from holding the server forever.
    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    public ProcessResult run(List<String> command, Path directory, String input) {
        // Record the start so performance data can be returned later.
        long started = System.nanoTime();
        try {
            // Start javac, java, python, or g++ in the submission's temporary directory.
            Process process = new ProcessBuilder(command).directory(directory.toFile()).start();
            if (input != null && !input.isBlank()) process.getOutputStream().write(input.getBytes(StandardCharsets.UTF_8));
            process.getOutputStream().close();
            // waitFor returns false when the program exceeds the allowed time.
            boolean finished = process.waitFor(TIMEOUT.toMillis(), TimeUnit.MILLISECONDS);
            if (!finished) { process.destroyForcibly(); process.waitFor(); }
            // Read both output streams before returning the process result.
            return new ProcessResult(finished, process.exitValue(), new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8), new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8), TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started));
        } catch (IOException e) {
            return new ProcessResult(true, -1, "", e.getMessage(), TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new ProcessResult(false, -1, "", "Execution interrupted", TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started));
        }
    }

    public Diagnostic unavailable(String tool) { return new Diagnostic(0, 0, tool + " is not installed or is unavailable on the server.", "ENVIRONMENT"); }
    public record ProcessResult(boolean finished, int exitCode, String stdout, String stderr, long durationMillis) { }
}
