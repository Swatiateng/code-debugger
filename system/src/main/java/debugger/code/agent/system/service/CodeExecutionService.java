
package debugger.code.agent.system.service;

import debugger.code.agent.system.model.Diagnostic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Duration;
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

        List<String> dockerCommand = new ArrayList<>();

        dockerCommand.addAll(List.of(
                "docker", "run",
                "--rm",
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
                "--mount",
                "type=bind,source=" + directory.toAbsolutePath() +
                        ",target=/workspace",
                "-i",
                dockerImage
        ));

        // Translate host-specific paths and executable names.
        List<String> containerCommand = new ArrayList<>();

        for (String argument : command) {
            if (argument.equals(directory.toString()) ||
                    argument.equals(directory.toAbsolutePath().toString())) {
                containerCommand.add("/workspace");
            } else if (argument.equals("python")) {
                containerCommand.add("python3");
            } else if (argument.equals("program.exe")) {
                containerCommand.add("./program");
            } else {
                containerCommand.add(argument);
            }
        }

        dockerCommand.addAll(containerCommand);

        Process process = null;

        try {
            process = new ProcessBuilder(dockerCommand).start();

            if (input != null && !input.isEmpty()) {
                process.getOutputStream().write(
                        input.getBytes(StandardCharsets.UTF_8));
            }

            process.getOutputStream().close();

            boolean finished = process.waitFor(
                    Duration.ofSeconds(timeoutSeconds).toMillis(),
                    TimeUnit.MILLISECONDS);

            if (!finished) {
                process.destroyForcibly();
                process.waitFor();

                // Remove the container if execution exceeded the timeout.
                new ProcessBuilder(
                        "docker", "rm", "-f", containerName
                ).start().waitFor(3, TimeUnit.SECONDS);
            }

            String stdout = new String(
                    process.getInputStream().readAllBytes(),
                    StandardCharsets.UTF_8);

            String stderr = new String(
                    process.getErrorStream().readAllBytes(),
                    StandardCharsets.UTF_8);

            return new ProcessResult(
                    finished,
                    finished ? process.exitValue() : -1,
                    stdout,
                    finished ? stderr : "Execution timed out.",
                    TimeUnit.NANOSECONDS.toMillis(
                            System.nanoTime() - started)
            );

        } catch (IOException e) {
            if (process != null) {
                process.destroyForcibly();
            }

            return new ProcessResult(
                    true, -1, "", e.getMessage(),
                    TimeUnit.NANOSECONDS.toMillis(
                            System.nanoTime() - started)
            );

        } catch (InterruptedException e) {
            if (process != null) {
                process.destroyForcibly();
            }

            Thread.currentThread().interrupt();

            return new ProcessResult(
                    false, -1, "", "Execution interrupted",
                    TimeUnit.NANOSECONDS.toMillis(
                            System.nanoTime() - started)
            );
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
