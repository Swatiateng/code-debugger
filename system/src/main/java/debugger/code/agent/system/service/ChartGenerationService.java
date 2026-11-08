package debugger.code.agent.system.service;

import debugger.code.agent.system.model.ChartDataResponse;
import debugger.code.agent.system.model.SeriesDTO;
import debugger.code.agent.system.repository.PerformanceMetricRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ChartGenerationService {
    /** Shared milestones, aligned with the frontend's complexity chart. */
    public static final List<Integer> X_AXIS = List.of(10, 100, 1_000, 10_000);

    private final PerformanceMetricRepository metrics;
    private final JdbcTemplate jdbc;

    public ChartGenerationService(PerformanceMetricRepository metrics, JdbcTemplate jdbc) {
        this.metrics = metrics;
        this.jdbc = jdbc;
    }

    public ChartDataResponse generatePerformanceChart(Long userId, List<Long> problemIds) {
        if (userId == null) throw new IllegalArgumentException("userId is required.");
        if (problemIds == null || problemIds.isEmpty()) throw new IllegalArgumentException("Provide at least one problemId.");
        List<Long> ids = problemIds.stream().filter(Objects::nonNull).distinct().toList();
        if (ids.isEmpty()) throw new IllegalArgumentException("Provide at least one valid problemId.");

        List<SeriesDTO> series = new ArrayList<>();
        for (Long problemId : ids) {
            String title = jdbc.query("SELECT title FROM problems WHERE id = ?", rs -> rs.next() ? rs.getString(1) : null, problemId);
            if (title == null) throw new IllegalArgumentException("Problem not found: " + problemId);
            List<PerformanceMetricRepository.BestMetric> profile = metrics.findBestProfile(userId, problemId);
            if (profile.isEmpty()) throw new IllegalArgumentException("No benchmark metrics for problem " + problemId + " and user " + userId);
            series.add(new SeriesDTO(title, interpolate(profile)));
        }
        return new ChartDataResponse(X_AXIS, series);
    }

    private List<Double> interpolate(List<PerformanceMetricRepository.BestMetric> profile) {
        List<PerformanceMetricRepository.BestMetric> sorted = profile.stream()
                .filter(p -> p.getInputSize() != null && p.getInputSize() > 0 && p.getExecutionTimeMs() != null)
                .sorted(Comparator.comparing(PerformanceMetricRepository.BestMetric::getInputSize)).toList();
        if (sorted.isEmpty()) throw new IllegalArgumentException("Benchmark profile contains no valid measurements.");
        return X_AXIS.stream().map(size -> runtimeAt(sorted, size)).toList();
    }

    private double runtimeAt(List<PerformanceMetricRepository.BestMetric> profile, int size) {
        var first = profile.get(0);
        var last = profile.get(profile.size() - 1);
        if (size <= first.getInputSize()) return first.getExecutionTimeMs();
        if (size >= last.getInputSize()) return last.getExecutionTimeMs();
        for (int i = 1; i < profile.size(); i++) {
            var right = profile.get(i);
            if (size <= right.getInputSize()) {
                var left = profile.get(i - 1);
                double ratio = (size - left.getInputSize()) / (double) (right.getInputSize() - left.getInputSize());
                return left.getExecutionTimeMs() + ratio * (right.getExecutionTimeMs() - left.getExecutionTimeMs());
            }
        }
        return last.getExecutionTimeMs();
    }
}
