package debugger.code.agent.system.model;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AnalyzeCodeRequest(
        @NotNull Language language,
        @NotBlank String code,
        // Optional standard input passed to the student's program.
        String input
) {
}
