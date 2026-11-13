package debugger.code.agent.system.service;

import debugger.code.agent.system.model.Diagnostic;
import debugger.code.agent.system.model.ExecutionResult;
import debugger.code.agent.system.model.Language;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CppLanguageAnalyzer implements LanguageAnalyzer {
    private static final Pattern ERROR_LINE = Pattern.compile(".*?:(\\d+):(\\d+):\\s*(?:error:)?\\s*(.*)");
    private final CodeExecutionService execution;
    public CppLanguageAnalyzer(CodeExecutionService execution) { this.execution = execution; }
    @Override public Language language() { return Language.CPP; }
    @Override public ExecutionResult analyze(String source, String input) {
        var run = execution.runSource(Language.CPP, source, input);
        boolean compiled = run.phase().equals("run");
        boolean error = run.exitCode() != 0 || !run.finished();
        List<Diagnostic> diagnostics = run.phase().equals("unavailable")
                ? List.of(execution.unavailable(run.stderr()))
                : error ? diagnostics(run.stderr(), !compiled ? "COMPILATION" : run.timedOut() ? "TIMEOUT" : "RUNTIME") : List.of();
        return new ExecutionResult(compiled, compiled && run.finished() && !error, run.timedOut(),
                run.exitCode(), run.stdout(), run.stderr(), run.durationMillis(), diagnostics);
    }
    private List<Diagnostic> diagnostics(String text, String type) { Matcher m = ERROR_LINE.matcher(text == null ? "" : text); return m.find() ? List.of(new Diagnostic(Integer.parseInt(m.group(1)), Integer.parseInt(m.group(2)), m.group(3), type)) : List.of(new Diagnostic(0, 0, text == null || text.isBlank() ? "Program failed without diagnostic output." : text, type)); }
}
