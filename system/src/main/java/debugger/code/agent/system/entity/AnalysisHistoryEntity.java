package debugger.code.agent.system.entity;

import debugger.code.agent.system.model.Language;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@Entity
@Table(name = "analysis_history")
@Getter
public class AnalysisHistoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Language language;

    @Column(name = "source_code", nullable = false, columnDefinition = "LONGTEXT")
    private String sourceCode;

    @Column(name = "standard_input", columnDefinition = "TEXT")
    private String standardInput;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "diagnostics_json", nullable = false, columnDefinition = "LONGTEXT")
    private String diagnosticsJson;

    @Column(name = "compiler_output", columnDefinition = "LONGTEXT")
    private String compilerOutput;

    @Column(name = "ai_explanation", columnDefinition = "LONGTEXT")
    private String aiExplanation;

    @Column(columnDefinition = "TEXT")
    private String hint;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected AnalysisHistoryEntity() {
    }

    public AnalysisHistoryEntity(
            Language language,
            String sourceCode,
            String standardInput,
            String status,
            String diagnosticsJson,
            String compilerOutput,
            String aiExplanation,
            String hint
    ) {
        this.language = language;
        this.sourceCode = sourceCode;
        this.standardInput = standardInput;
        this.status = status;
        this.diagnosticsJson = diagnosticsJson;
        this.compilerOutput = compilerOutput;
        this.aiExplanation = aiExplanation;
        this.hint = hint;
        this.createdAt = LocalDateTime.now();
    }
}