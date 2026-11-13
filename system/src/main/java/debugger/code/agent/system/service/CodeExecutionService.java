
package debugger.code.agent.system.service;

import debugger.code.agent.system.model.Diagnostic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class CodeExecutionService {

    private static final ParameterizedTypeReference<Map<String, Object>> RESPONSE_TYPE =
            new ParameterizedTypeReference<>() { };

    @Value("${app.execution.runner.url:}")
    private String runnerUrl;

    @Value("${app.execution.runner.secret:}")
    private String sandboxSecret;

    public ProcessResult runSource(debugger.code.agent.system.model.Language language, String source, String input) {
        if (runnerUrl == null || runnerUrl.isBlank() || sandboxSecret == null || sandboxSecret.isBlank()) {
            return new ProcessResult(true, -1, "", "Sandbox runner is not configured. Set SANDBOX_URL and SANDBOX_SECRET.", "unavailable", 0, false);
        }
        long started = System.nanoTime();
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("language", language.name().toLowerCase());
            request.put("code", source);
            request.put("input", input == null ? "" : input);
            SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
            requestFactory.setConnectTimeout(10_000);
            requestFactory.setReadTimeout(110_000);
            Map<String, Object> response = RestClient.builder()
                    .baseUrl(runnerUrl.replaceAll("/+$", ""))
                    .requestFactory(requestFactory)
                    .defaultHeader("x-sandbox-secret", sandboxSecret)
                    .build()
                    .post().uri("/execute").body(request).retrieve().body(RESPONSE_TYPE);
            if (response == null) {
                return new ProcessResult(true, -1, "", "Sandbox runner returned an empty response.", "unavailable", 0, false);
            }
            return new ProcessResult(
                    !Boolean.TRUE.equals(response.get("timedOut")),
                    integer(response.get("exitCode"), -1),
                    string(response.get("stdout")),
                    string(response.get("stderr")),
                    string(response.get("phase")),
                    longValue(response.get("durationMillis"), elapsedMillis(started)),
                    Boolean.TRUE.equals(response.get("timedOut"))
            );
        } catch (RestClientException error) {
            return new ProcessResult(true, -1, "", "Sandbox runner request failed: " + error.getMessage(),
                    "unavailable", elapsedMillis(started), false);
        }
    }

    private static String string(Object value) { return value == null ? "" : value.toString(); }
    private static int integer(Object value, int fallback) { return value instanceof Number n ? n.intValue() : fallback; }
    private static long longValue(Object value, long fallback) { return value instanceof Number n ? n.longValue() : fallback; }
    private static long elapsedMillis(long started) { return TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started); }

    public Diagnostic unavailable(String tool) {
        return new Diagnostic(
                0, 0,
                tool + " is not installed or is unavailable on the server.",
                "ENVIRONMENT"
        );
    }

    public record ProcessResult(
            boolean finished,
            int exitCode,
            String stdout,
            String stderr,
            String phase,
            long durationMillis,
            boolean timedOut
    ) { }
}
