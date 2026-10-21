package debugger.code.agent.system.repository;

import debugger.code.agent.system.entity.AnalysisHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnalysisHistoryRepository
        extends JpaRepository<AnalysisHistoryEntity, Long> {

    List<AnalysisHistoryEntity> findAllByOrderByCreatedAtDesc();
}