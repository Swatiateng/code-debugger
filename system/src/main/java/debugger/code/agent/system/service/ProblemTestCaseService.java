package debugger.code.agent.system.service;

import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

@Service
public class ProblemTestCaseService {
    private final JdbcTemplate jdbcTemplate;

    public ProblemTestCaseService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<TestCase> findByProblemId(String problemId) {
        List<TestCase> cases = jdbcTemplate.query("""
                SELECT tc.input_text, tc.expected_output
                FROM problem_test_cases tc
                JOIN problems p ON p.id = tc.problem_id
                WHERE p.slug = ?
                ORDER BY tc.id
                """,
                (result, rowNumber) -> new TestCase(
                        result.getString("input_text"), result.getString("expected_output")),
                problemId);
        return cases.isEmpty() ? null : cases;
    }

    public record TestCase(String input, String expectedOutput) { }
}
