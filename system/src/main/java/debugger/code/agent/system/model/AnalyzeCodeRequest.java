package debugger.code.agent.system.model;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AnalyzeCodeRequest(
        @NotNull Language language,
        @NotBlank String code,
        // Slug of the selected practice problem; omitted for free-form analysis.
        String problemId,
        // Optional standard input passed to the student's program.
        String input,
        // Description and I/O expectations of the selected practice problem.
        String problemStatement,
        // Student's reply to the prior AI interview question, when continuing the discussion.
        String studentReasoning,
        // Prior AI turn, used only as conversation context for progressive hints.
        String previousAiResponse,
        // Hint level shown in the previous AI turn.
        Integer previousHintLevel
) {
}
