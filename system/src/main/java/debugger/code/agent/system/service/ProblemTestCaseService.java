package debugger.code.agent.system.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ProblemTestCaseService {
    private final Map<String, List<TestCase>> testCases = Map.of(
            "sum-two-numbers", List.of(
                    new TestCase("2 3\n", "5\n"),
                    new TestCase("-4 7\n", "3\n"),
                    new TestCase("0 0\n", "0\n"),
                    new TestCase("100000 250000\n", "350000\n"),
                    new TestCase("-12 -8\n", "-20\n"),
                    new TestCase("999999999 1\n", "1000000000\n")
            ),
            "reverse-string", List.of(
                    new TestCase("hello\n", "olleh\n"),
                    new TestCase("a\n", "a\n"),
                    new TestCase(" two words \n", " sdrow owt \n"),
                    new TestCase("\n", "\n"),
                    new TestCase("12345\n", "54321\n"),
                    new TestCase("racecar\n", "racecar\n")
            )
    );

    public List<TestCase> findByProblemId(String problemId) {
        return testCases.get(problemId);
    }

    public record TestCase(String input, String expectedOutput) { }
}
