package debugger.code.agent.system.service;

import debugger.code.agent.system.model.AiExplanation;
import debugger.code.agent.system.model.AnalyzeCodeRequest;
import debugger.code.agent.system.model.AnalyzeCodeResponse;
import debugger.code.agent.system.model.ExecutionResult;
import debugger.code.agent.system.model.Language;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class CodeAnalysisService {
    // This is our directory of specialists: JAVA -> JavaLanguageAnalyzer, PYTHON -> PythonLanguageAnalyzer, etc.
    private final Map<Language, LanguageAnalyzer> analyzers = new EnumMap<>(Language.class);
    private final AiExplanationService aiExplanationService;

    public CodeAnalysisService(List<LanguageAnalyzer> analyzers, AiExplanationService aiExplanationService) {
        analyzers.forEach(analyzer -> this.analyzers.put(analyzer.language(), analyzer));
        this.aiExplanationService = aiExplanationService;
    }

    public AnalyzeCodeResponse analyze(AnalyzeCodeRequest request) {
        // Step 1: choose the specialist who understands the language selected by the student.
        LanguageAnalyzer analyzer = analyzers.get(request.language());
        if (analyzer == null) throw new IllegalArgumentException("Unsupported language: " + request.language());
        // Step 2: ask that specialist to compile/run the program and collect any error messages.
        ExecutionResult result = analyzer.analyze(request.code(), request.input());
        String output = result.standardError().isBlank() ? result.standardOutput() : result.standardError();
        // Step 3: if there is an error, ask the AI layer to turn technical compiler text into student-friendly language.
        AiExplanation explanation = result.diagnostics().isEmpty()
                ? new AiExplanation("The program compiled and ran successfully.", "Try another input to validate edge cases.")
                : aiExplanationService.explain(request.language(), request.code(), output);
        // Step 4: package everything into one simple response that the frontend can display.
        String status = result.timedOut() ? "TIMEOUT" : result.diagnostics().isEmpty() ? "SUCCESS" : "ERROR";
        return new AnalyzeCodeResponse(status, request.language(), result.diagnostics(), output, explanation.explanation(), explanation.hint());
    }
}
