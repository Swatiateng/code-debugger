package debugger.code.agent.system.service;

import debugger.code.agent.system.model.Diagnostic;
import debugger.code.agent.system.model.ExecutionResult;
import debugger.code.agent.system.model.Language;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class JavaLanguageAnalyzer implements LanguageAnalyzer {
    private static final Pattern ERROR_LINE = Pattern.compile(".*?:(\\d+):(?:\\s+error:)?\\s*(.*)");
    private final CodeExecutionService execution;
    public JavaLanguageAnalyzer(CodeExecutionService execution) { this.execution = execution; }
    @Override public Language language() { return Language.JAVA; }

    @Override public ExecutionResult analyze(String source, String input) {
        var run = execution.runSource(Language.JAVA, source, input);
        boolean compiled = run.phase().equals("run");
        boolean error = run.exitCode() != 0 || !run.finished();
        List<Diagnostic> diagnosticList = run.phase().equals("unavailable")
                ? List.of(execution.unavailable(run.stderr()))
                : error ? diagnostics(run.stderr(), !compiled ? "COMPILATION" : run.timedOut() ? "TIMEOUT" : "RUNTIME") : List.of();
        return result(compiled, compiled && run.finished() && !error, run.timedOut(), run, diagnosticList);
    }
    private ExecutionResult result(boolean compiled, boolean ran, boolean timedOut, CodeExecutionService.ProcessResult p, List<Diagnostic> d) { return new ExecutionResult(compiled, ran, timedOut, p.exitCode(), p.stdout(), p.stderr(), p.durationMillis(), d); }
    private List<Diagnostic> diagnostics(String text, String type) {
        var matcher = ERROR_LINE.matcher(text == null ? "" : text);
        return matcher.find()
                ? List.of(new Diagnostic(Integer.parseInt(matcher.group(1)), 0, matcher.group(2), type))
                : List.of(new Diagnostic(0, 0, blank(text), type));
    }
    private String blank(String value) { return value == null || value.isBlank() ? "Program failed without diagnostic output." : value; }
}
