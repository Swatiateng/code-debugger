package debugger.code.agent.system.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "performance_metrics", indexes = @Index(name = "idx_metrics_user_problem_size", columnList = "user_id, problem_id, input_size"))
public class PerformanceMetricEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "problem_id", nullable = false)
    private Long problemId;

    @Column(name = "input_size", nullable = false)
    private Integer inputSize;

    @Column(name = "execution_time_ms", nullable = false)
    private Double executionTimeMs;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    protected PerformanceMetricEntity() { }
}
