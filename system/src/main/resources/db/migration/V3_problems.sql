CREATE TABLE problems (
                          id BIGINT PRIMARY KEY AUTO_INCREMENT,
                          slug VARCHAR(100) NOT NULL UNIQUE,
                          title VARCHAR(160) NOT NULL,
                          description TEXT NOT NULL,
                          constraints_text TEXT,
                          difficulty ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL,
                          starter_java TEXT,
                          starter_python TEXT,
                          starter_cpp TEXT,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE problem_examples (
                                  id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                  problem_id BIGINT NOT NULL,
                                  example_number INT NOT NULL,
                                  input_text TEXT NOT NULL,
                                  output_text TEXT NOT NULL,
                                  explanation TEXT,
                                  FOREIGN KEY (problem_id) REFERENCES problems(id)
);

CREATE TABLE problem_test_cases (
                                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                    problem_id BIGINT NOT NULL,
                                    input_text TEXT NOT NULL,
                                    expected_output TEXT NOT NULL,
                                    is_hidden BOOLEAN DEFAULT TRUE,
                                    FOREIGN KEY (problem_id) REFERENCES problems(id)
);

CREATE TABLE submissions (
                             id BIGINT PRIMARY KEY AUTO_INCREMENT,
                             problem_id BIGINT NOT NULL,
                             language VARCHAR(20) NOT NULL,
                             source_code LONGTEXT NOT NULL,
                             status VARCHAR(30),
                             submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                             FOREIGN KEY (problem_id) REFERENCES problems(id)
);

CREATE TABLE interview_messages (
                                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                    submission_id BIGINT NOT NULL,
                                    role ENUM('USER', 'ASSISTANT') NOT NULL,
                                    message TEXT NOT NULL,
                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                    FOREIGN KEY (submission_id) REFERENCES submissions(id)
);
