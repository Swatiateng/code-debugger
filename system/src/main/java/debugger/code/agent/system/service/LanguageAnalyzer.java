package debugger.code.agent.system.service;

import debugger.code.agent.system.model.ExecutionResult;
import debugger.code.agent.system.model.Language;

public interface LanguageAnalyzer {
    Language language();
    ExecutionResult analyze(String sourceCode, String input);
}
