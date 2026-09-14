package debugger.code.agent.system.model;


import java.util.List;

public record AnalyzeCodeResponse(
        String status,
        Language language,
        List<Diagnostic> diagnostics,
        String compilerOutput,
        String aiExplanation,
        String hint
) {
}

