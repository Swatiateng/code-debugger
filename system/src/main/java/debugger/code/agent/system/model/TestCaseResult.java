package debugger.code.agent.system.model;

public record TestCaseResult(
        int caseNumber,
        boolean passed,
        String input,
        String expectedOutput,
        String actualOutput,
        String message
) {
}
