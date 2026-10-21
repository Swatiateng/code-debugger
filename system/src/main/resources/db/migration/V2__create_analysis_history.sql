CREATE TABLE analysis_history (
                                  id BIGINT NOT NULL AUTO_INCREMENT,
                                  language VARCHAR(20) NOT NULL,
                                  source_code LONGTEXT NOT NULL,
                                  standard_input TEXT NULL,
                                  status VARCHAR(30) NOT NULL,
                                  diagnostics_json LONGTEXT NOT NULL,
                                  compiler_output LONGTEXT NULL,
                                  ai_explanation LONGTEXT NULL,
                                  hint TEXT NULL,
                                  created_at DATETIME NOT NULL,
                                  PRIMARY KEY (id),
                                  INDEX idx_analysis_history_created_at (created_at)
);