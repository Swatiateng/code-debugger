package debugger.code.agent.system.model;

public record Diagnostic(
        int line,
        int column,
        String message,
        // Examples: COMPILATION, RUNTIME, TIMEOUT, ENVIRONMENT.
        String type
) {
}
