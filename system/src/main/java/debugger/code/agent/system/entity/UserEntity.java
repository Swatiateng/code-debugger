package debugger.code.agent.system.entity;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class UserEntity {

    @Getter
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Getter
    @Column(nullable = false, length = 100)
    private String name;

    @Getter
    @Column(name = "login_id", nullable = false, unique = true, length = 100)
    private String loginId;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected UserEntity() {
    }

    public UserEntity(String name, String loginId, String passwordHash) {
        this.name = name;
        this.loginId = loginId;
        this.passwordHash = passwordHash;
        this.createdAt = LocalDateTime.now();
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
}