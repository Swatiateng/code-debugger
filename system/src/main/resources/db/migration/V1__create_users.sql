CREATE TABLE users (
                       id BIGINT NOT NULL AUTO_INCREMENT,
                       name VARCHAR(100) NOT NULL,
                       login_id VARCHAR(100) NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       created_at DATETIME NOT NULL,
                       PRIMARY KEY (id),
                       CONSTRAINT uk_users_login_id UNIQUE (login_id)
);