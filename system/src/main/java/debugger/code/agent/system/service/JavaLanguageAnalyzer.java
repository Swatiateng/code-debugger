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

@Service
public class JavaLanguageAnalyzer implements LanguageAnalyzer {
    private static final Pattern PUBLIC_CLASS = Pattern.compile("public\\s+class\\s+([A-Za-z_$][\\w$]*)");
    private static final Pattern ERROR_LINE = Pattern.compile(".*?:(\\d+):(?:\\s+error:)?\\s*(.*)");
    private final CodeExecutionService execution;
    public JavaLanguageAnalyzer(CodeExecutionService execution) { this.execution = execution; }
    @Override public Language language() { return Language.JAVA; }

    @Override public ExecutionResult analyze(String source, String input) {
        try {
            Path dir = Files.createTempDirectory("code-analysis-java-");
            String name = className(source);
            Files.writeString(dir.resolve(name + ".java"), source);
            var compile = execution.run(List.of("javac", name + ".java"), dir, null);
            if (compile.exitCode() != 0) return result(false, false, false, compile, diagnostics(compile.stderr(), "COMPILATION"));
            var run = execution.run(List.of("java", "-cp", dir.toString(), name), dir, input);
            boolean error = run.exitCode() != 0 || !run.finished();
            return result(true, run.finished() && !error, !run.finished(), run, error ? diagnostics(run.stderr(), run.finished() ? "RUNTIME" : "TIMEOUT") : List.of());
        } catch (IOException e) { return unavailable("Java compiler", e.getMessage()); }
    }
    private String className(String source) { Matcher m = PUBLIC_CLASS.matcher(source); return m.find() ? m.group(1) : "Main"; }
    private ExecutionResult result(boolean compiled, boolean ran, boolean timedOut, CodeExecutionService.ProcessResult p, List<Diagnostic> d) { return new ExecutionResult(compiled, ran, timedOut, p.exitCode(), p.stdout(), p.stderr(), p.durationMillis(), d); }
    private List<Diagnostic> diagnostics(String text, String type) { Matcher m = ERROR_LINE.matcher(text == null ? "" : text); return m.find() ? List.of(new Diagnostic(Integer.parseInt(m.group(1)), 0, m.group(2), type)) : List.of(new Diagnostic(0, 0, blank(text), type)); }
    private String blank(String value) { return value == null || value.isBlank() ? "Program failed without diagnostic output." : value; }
    private ExecutionResult unavailable(String tool, String error) { return new ExecutionResult(false, false, false, -1, "", error, 0, List.of(execution.unavailable(tool))); }
}
