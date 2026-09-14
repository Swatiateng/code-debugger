package debugger.code.agent.system.service;

import debugger.code.agent.system.model.Diagnostic;
import debugger.code.agent.system.model.ExecutionResult;
import debugger.code.agent.system.model.Language;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Runs Python source and changes Python errors into our common Diagnostic format. */
@Service // Registers this class as a Spring-managed service.
public class PythonLanguageAnalyzer implements LanguageAnalyzer {
    // Python tracebacks normally contain text such as "line 12".
    private static final Pattern LINE = Pattern.compile("line\\s+(\\d+)");
    private final CodeExecutionService execution;

    public PythonLanguageAnalyzer(CodeExecutionService execution) { this.execution = execution; }
    @Override public Language language() { return Language.PYTHON; }

    @Override
    public ExecutionResult analyze(String source, String input) {
        try {
            // Keep the submitted file separate from the Spring application files.
            Path directory = Files.createTempDirectory("code-analysis-python-");
            Files.writeString(directory.resolve("main.py"), source);
            var run = execution.run(List.of("python", "main.py"), directory, input);
            boolean hasError = run.exitCode() != 0 || !run.finished();
            return new ExecutionResult(true, run.finished() && !hasError, !run.finished(), run.exitCode(), run.stdout(), run.stderr(), run.durationMillis(), hasError ? diagnostics(run.stderr(), run.finished() ? "RUNTIME" : "TIMEOUT") : List.of());
        } catch (IOException exception) {
            // This happens, for example, if a temporary source file cannot be created.
            return new ExecutionResult(false, false, false, -1, "", exception.getMessage(), 0, List.of(execution.unavailable("Python interpreter")));
        }
    }

    private List<Diagnostic> diagnostics(String errorText, String type) {
        Matcher lineMatcher = LINE.matcher(errorText == null ? "" : errorText);
        int line = lineMatcher.find() ? Integer.parseInt(lineMatcher.group(1)) : 0;
        String message = errorText == null || errorText.isBlank() ? "Program failed without diagnostic output." : errorText;
        return List.of(new Diagnostic(line, 0, message, type));
    }
}
