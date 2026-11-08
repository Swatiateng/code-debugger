package debugger.code.agent.system.service;

import debugger.code.agent.system.model.AiExplanation;
import debugger.code.agent.system.model.AnalyzeCodeRequest;
import debugger.code.agent.system.model.AnalyzeCodeResponse;
import debugger.code.agent.system.model.ExecutionResult;
import debugger.code.agent.system.model.Language;
import debugger.code.agent.system.model.TestCaseResult;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class CodeAnalysisService {
    // This is our directory of specialists: JAVA -> JavaLanguageAnalyzer, PYTHON -> PythonLanguageAnalyzer, etc.
    private final Map<Language, LanguageAnalyzer> analyzers = new EnumMap<>(Language.class);
    private final AiExplanationService aiExplanationService;
    private final ProblemTestCaseService problemTestCaseService;

    public CodeAnalysisService(List<LanguageAnalyzer> analyzers,
                               AiExplanationService aiExplanationService,
                               ProblemTestCaseService problemTestCaseService) {
        analyzers.forEach(analyzer -> this.analyzers.put(analyzer.language(), analyzer));
        this.aiExplanationService = aiExplanationService;
        this.problemTestCaseService = problemTestCaseService;
    }

    public AnalyzeCodeResponse analyze(AnalyzeCodeRequest request) {
        // Step 1: choose the specialist who understands the language selected by the student.
        LanguageAnalyzer analyzer = analyzers.get(request.language());
        if (analyzer == null) throw new IllegalArgumentException("Unsupported language: " + request.language());
        List<ProblemTestCaseService.TestCase> cases = request.problemId() == null || request.problemId().isBlank()
                ? null : problemTestCaseService.findByProblemId(request.problemId());
        if (request.problemId() != null && !request.problemId().isBlank() && cases == null) {
            throw new IllegalArgumentException("Unknown problem: " + request.problemId());
        }

        // Run user-provided input for the output panel; otherwise use the first saved problem case.
        String firstInput = request.input() != null && !request.input().isEmpty()
                ? request.input()
                : cases == null ? request.input() : cases.getFirst().input();
        ExecutionResult result = analyzer.analyze(request.code(), firstInput);
        String output = result.standardError().isBlank() ? result.standardOutput() : result.standardError();
        if (result.timedOut()) {
            output = (output == null || output.isBlank() ? "" : output + "\n")
                    + "Execution timed out after " + result.durationMillis()
                    + " ms; output may be incomplete.";
        }
        List<TestCaseResult> caseResults = List.of();
        boolean wrongAnswer = false;
        if (cases != null && result.compiled()) {
            var results = new java.util.ArrayList<TestCaseResult>();
            for (int i = 0; i < cases.size(); i++) {
                var testCase = cases.get(i);
                ExecutionResult run = analyzer.analyze(request.code(), testCase.input());
                String actual = run.standardOutput();
                boolean passed = run.diagnostics().isEmpty()
                        && normalize(actual).equals(normalize(testCase.expectedOutput()));
                String message = passed ? "Passed"
                        : run.diagnostics().isEmpty() ? "Output did not match expected output"
                        : run.diagnostics().getFirst().message();
                results.add(new TestCaseResult(i + 1, passed, testCase.input(),
                        testCase.expectedOutput(), actual, message));
                if (!passed) wrongAnswer = true;
            }
            caseResults = List.copyOf(results);
        }

        List<TestCaseResult> failedCases = caseResults.stream().filter(testCase -> !testCase.passed()).toList();
        AiExplanation explanation = aiExplanationService.explain(request.language(), request.code(), output,
                request.problemStatement(), failedCases, request.studentReasoning(),
                request.previousAiResponse(), request.previousHintLevel(),
                request.studentReasoningHistory());
        String status = result.timedOut() ? "TIMEOUT"
                : !result.diagnostics().isEmpty() ? "ERROR"
                : wrongAnswer ? "WRONG_ANSWER" : "SUCCESS";
        return new AnalyzeCodeResponse(status, request.language(), result.diagnostics(), output,
                explanation.explanation(), explanation.hint(), caseResults);
    }

    private String normalize(String value) {
        return value == null ? "" : value.replace("\r\n", "\n").strip();
    }
}
