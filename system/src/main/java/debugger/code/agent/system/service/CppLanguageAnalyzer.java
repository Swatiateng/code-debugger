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
public class CppLanguageAnalyzer implements LanguageAnalyzer {
    private static final Pattern ERROR_LINE = Pattern.compile(".*?:(\\d+):(\\d+):\\s*(?:error:)?\\s*(.*)");
    private final CodeExecutionService execution;
    public CppLanguageAnalyzer(CodeExecutionService execution) { this.execution = execution; }
    @Override public Language language() { return Language.CPP; }
    @Override public ExecutionResult analyze(String source, String input) {
        try {
            Path dir = Files.createTempDirectory("code-analysis-cpp-");
            Files.writeString(dir.resolve("main.cpp"), source);
            var compile = execution.run(List.of("g++", "-std=c++17", "main.cpp", "-o", "program"), dir, null);
            if (compile.exitCode() != 0) return new ExecutionResult(false, false, false, compile.exitCode(), compile.stdout(), compile.stderr(), compile.durationMillis(), diagnostics(compile.stderr(), "COMPILATION"));
            var run = execution.run(List.of(System.getProperty("os.name").toLowerCase().contains("win") ? "program.exe" : "./program"), dir, input);
            boolean error = run.exitCode() != 0 || !run.finished();
            return new ExecutionResult(true, run.finished() && !error, !run.finished(), run.exitCode(), run.stdout(), run.stderr(), compile.durationMillis() + run.durationMillis(), error ? diagnostics(run.stderr(), run.finished() ? "RUNTIME" : "TIMEOUT") : List.of());
        } catch (IOException e) { return new ExecutionResult(false, false, false, -1, "", e.getMessage(), 0, List.of(execution.unavailable("g++ compiler"))); }
    }
    private List<Diagnostic> diagnostics(String text, String type) { Matcher m = ERROR_LINE.matcher(text == null ? "" : text); return m.find() ? List.of(new Diagnostic(Integer.parseInt(m.group(1)), Integer.parseInt(m.group(2)), m.group(3), type)) : List.of(new Diagnostic(0, 0, text == null || text.isBlank() ? "Program failed without diagnostic output." : text, type)); }
}
