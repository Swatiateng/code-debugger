CREATE TABLE performance_metrics (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    problem_id BIGINT NOT NULL,
    input_size INT NOT NULL,
    execution_time_ms DOUBLE NOT NULL,
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_metrics_user_problem_size (user_id, problem_id, input_size),
    CONSTRAINT fk_metrics_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_metrics_problem FOREIGN KEY (problem_id) REFERENCES problems(id),
    CONSTRAINT chk_metrics_input_size CHECK (input_size > 0),
    CONSTRAINT chk_metrics_execution_time CHECK (execution_time_ms >= 0)
);
