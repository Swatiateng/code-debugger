package debugger.code.agent.system.model;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AnalyzeCodeRequest(
        @NotNull Language language,
        @NotBlank String code,
        // Slug of the selected practice problem; omitted for free-form analysis.
        String problemId,
        // Optional standard input passed to the student's program.
        String input
) {
}
