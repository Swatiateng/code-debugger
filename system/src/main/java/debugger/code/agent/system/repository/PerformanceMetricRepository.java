package debugger.code.agent.system.repository;

import debugger.code.agent.system.entity.PerformanceMetricEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PerformanceMetricRepository extends JpaRepository<PerformanceMetricEntity, Long> {
    interface BestMetric {
        Integer getInputSize();
        Double getExecutionTimeMs();
    }

    @Query(value = "SELECT input_size AS inputSize, MIN(execution_time_ms) AS executionTimeMs " +
            "FROM performance_metrics WHERE user_id = :userId AND problem_id = :problemId " +
            "GROUP BY input_size ORDER BY input_size", nativeQuery = true)
    List<BestMetric> findBestProfile(@Param("userId") Long userId, @Param("problemId") Long problemId);
}
