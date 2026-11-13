package debugger.code.agent.system.service;

import debugger.code.agent.system.model.Diagnostic;
import debugger.code.agent.system.model.ExecutionResult;
import debugger.code.agent.system.model.Language;
import org.springframework.stereotype.Service;

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
        var run = execution.runSource(debugger.code.agent.system.model.Language.PYTHON, source, input);
        boolean available = !run.phase().equals("unavailable");
        boolean hasError = run.exitCode() != 0 || !run.finished();
        List<Diagnostic> diagnostics = run.phase().equals("unavailable")
                ? List.of(execution.unavailable(run.stderr()))
                : hasError ? diagnostics(run.stderr(), run.timedOut() ? "TIMEOUT" : "RUNTIME") : List.of();
        return new ExecutionResult(available, available && run.finished() && !hasError, run.timedOut(), run.exitCode(),
                run.stdout(), run.stderr(), run.durationMillis(), diagnostics);
    }

    private List<Diagnostic> diagnostics(String errorText, String type) {
        Matcher lineMatcher = LINE.matcher(errorText == null ? "" : errorText);
        int line = lineMatcher.find() ? Integer.parseInt(lineMatcher.group(1)) : 0;
        String message = errorText == null || errorText.isBlank() ? "Program failed without diagnostic output." : errorText;
        return List.of(new Diagnostic(line, 0, message, type));
    }
}
