package debugger.code.agent.system.service;

import debugger.code.agent.system.config.AiProperties;
import debugger.code.agent.system.model.AiExplanation;
import debugger.code.agent.system.model.Language;
import org.springframework.stereotype.Service;

/**
 * Temporary beginner-friendly implementation. It provides a safe fallback explanation.
 * Later, replace the body of explain() with an Ollama/OpenAI API call.
 */
@Service
public class OpenAiExplainationService implements AiExplanationService {
    public OpenAiExplainationService(AiProperties properties) {
        // Spring injects application.properties values here. It will be used for the real AI call later.
    }

    @Override
    public AiExplanation explain(Language language, String sourceCode, String compilerOutput) {
        // Do not expose a full solution: this is deliberately a learning-oriented fallback.
        return new AiExplanation(
                "Your " + language + " program reported an error. Read the compiler output and start with its first message.",
                "Check the first reported line for a spelling, type, bracket, or syntax mistake."
        );
    }
}
