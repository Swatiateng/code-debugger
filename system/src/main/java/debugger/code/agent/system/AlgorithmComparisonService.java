
package debugger.code.agent.system.service;

import debugger.code.agent.system.model.AlgorithmComparisonRequest;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.List;

@Service
public class AlgorithmComparisonService {

    private final CodeExecutionService codeExecutionService;

    public AlgorithmComparisonService(
            CodeExecutionService codeExecutionService) {
        this.codeExecutionService = codeExecutionService;
    }

    public Map<String, Object> compareAlgorithms(
            AlgorithmComparisonRequest request) throws Exception {

        Map<String, Object> result = new LinkedHashMap<>();

        Path directory1 = Files.createTempDirectory("algorithm1");
        Path directory2 = Files.createTempDirectory("algorithm2");

        try {
            String language = request.language().toUpperCase();

            String fileName;
            List<String> command1;
            List<String> command2;

            switch (language) {
                case "PYTHON":
                    fileName = "main.py";
                    command1 = List.of("python", "/workspace/main.py");
                    command2 = List.of("python", "/workspace/main.py");
                    break;

                default:
                    throw new IllegalArgumentException(
                            "Currently only Python is supported.");
            }

            Files.writeString(directory1.resolve(fileName),
                    request.code1());

            Files.writeString(directory2.resolve(fileName),
                    request.code2());

            CodeExecutionService.ProcessResult execution1 =
                    codeExecutionService.run(command1, directory1, "");

            CodeExecutionService.ProcessResult execution2 =
                    codeExecutionService.run(command2, directory2, "");

            result.put("algorithm1", request.algorithm1());
            result.put("algorithm2", request.algorithm2());

           result.put("output1", execution1.stdout());
result.put("output2", execution2.stdout());

result.put("stderr1", execution1.stderr());
result.put("stderr2", execution2.stderr());

result.put("status1",
        execution1.finished() && execution1.exitCode() == 0
                ? "SUCCESS" : "ERROR");

result.put("status2",
        execution2.finished() && execution2.exitCode() == 0
                ? "SUCCESS" : "ERROR");
            result.put("executionTime1",
                    execution1.durationMillis());

            result.put("executionTime2",
                    execution2.durationMillis());

            result.put("fasterAlgorithm",
                    execution1.durationMillis()
                            < execution2.durationMillis()
                            ? request.algorithm1()
                            : request.algorithm2());

            return result;

        } finally {
            try {
                Files.deleteIfExists(directory1.resolve("main.py"));
                Files.deleteIfExists(directory2.resolve("main.py"));
                Files.deleteIfExists(directory1);
                Files.deleteIfExists(directory2);
            } catch (Exception ignored) {
            }
        }
    }
}
