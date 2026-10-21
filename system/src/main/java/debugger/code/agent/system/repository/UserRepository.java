package debugger.code.agent.system.repository;

import debugger.code.agent.system.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    boolean existsByLoginId(String loginId);
}