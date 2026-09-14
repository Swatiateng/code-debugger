package debugger.code.agent.system.service;

import debugger.code.agent.system.model.AiExplanation;
import debugger.code.agent.system.model.Language;

public interface AiExplanationService {

    AiExplanation explain(
            Language language,
            String sourceCode,
            String compilerOutput
    );
}