package debugger.code.agent.system.service;

import debugger.code.agent.system.config.AiProperties;
import debugger.code.agent.system.model.AiExplanation;
import debugger.code.agent.system.model.Language;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

@Service
public class OpenAiExplanationService implements AiExplanationService {

    private final AiProperties properties;
    private final RestClient restClient;

    public OpenAiExplanationService(AiProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.create();
    }

    @Override
    public AiExplanation explain(
            Language language,
            String sourceCode,
            String compilerOutput) {

        String prompt = """
                You are a helpful programming tutor.
                Explain the following programming error in simple language.

                Programming language: %s

                Source code:
                %s

                Compiler output:
                %s

                Explain the cause of the error and suggest how to fix it.
                Keep the explanation beginner-friendly.
                """.formatted(language, sourceCode, compilerOutput);

        Map<String, Object> request = Map.of(
                "model", properties.model(),
                "messages", List.of(
                        Map.of("role", "user", "content", prompt)
                ),
                "stream", false
        );

        try {
            Map<?, ?> response = restClient.post()
                    .uri(properties.baseUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(Map.class);

            if (response == null || !(response.get("message") instanceof Map<?, ?> message)) {
                throw new IllegalStateException("Invalid response from Ollama");
            }

            String explanation = String.valueOf(message.get("content"));

            return new AiExplanation(
                    explanation,
                    "Start by fixing the first error reported by the compiler."
            );

        } catch (RestClientException | IllegalStateException e) {
            return new AiExplanation(
                    "Could not get an AI explanation. Please check that Ollama is running.",
                    "Check your Ollama connection at http://localhost:11434."
            );
        }
    }
}