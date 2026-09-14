package debugger.code.agent.system.model;

import java.util.List;

/**
 * Internal result of compiling and/or running submitted code.
 * The controller converts this into the smaller API response sent to the client.
 */
public record ExecutionResult(
        boolean compiled,
        boolean ran,
        boolean timedOut,
        int exitCode,
        String standardOutput,
        String standardError,
        long durationMillis,
        List<Diagnostic> diagnostics
) {
}
