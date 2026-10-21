package debugger.code.agent.system.service;

import debugger.code.agent.system.entity.AnalysisHistoryEntity;
import debugger.code.agent.system.model.*;
import debugger.code.agent.system.repository.AnalysisHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.util.Arrays;
import java.util.List;

@Service
public class AnalysisHistoryService {

    private final AnalysisHistoryRepository analysisHistoryRepository;
    private final ObjectMapper objectMapper;

    public AnalysisHistoryService(
            AnalysisHistoryRepository analysisHistoryRepository,
            ObjectMapper objectMapper
    ) {
        this.analysisHistoryRepository = analysisHistoryRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void save(
            AnalyzeCodeRequest request,
            AnalyzeCodeResponse response
    ) {
        analysisHistoryRepository.save(toEntity(request, response));
    }

    @Transactional(readOnly = true)
    public List<AnalysisHistoryItem> findAll() {
        return analysisHistoryRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toHistoryItem)
                .toList();
    }

    private AnalysisHistoryEntity toEntity(
            AnalyzeCodeRequest request,
            AnalyzeCodeResponse response
    ) {
        try {
            String diagnosticsJson = objectMapper.writeValueAsString(
                    response.diagnostics() == null ? List.of() : response.diagnostics()
            );

            return new AnalysisHistoryEntity(
                    request.language(),
                    request.code(),
                    request.input(),
                    response.status(),
                    diagnosticsJson,
                    response.compilerOutput(),
                    response.aiExplanation(),
                    response.hint()
            );
        } catch (JacksonException exception) {
            throw new IllegalStateException(
                    "Could not save analysis diagnostics",
                    exception
            );
        }
    }

    private AnalysisHistoryItem toHistoryItem(AnalysisHistoryEntity entity) {
        try {
            Diagnostic[] diagnosticsArray = objectMapper.readValue(
                    entity.getDiagnosticsJson(),
                    Diagnostic[].class
            );

            List<Diagnostic> diagnostics = Arrays.asList(diagnosticsArray);

            AnalyzeCodeRequest request = new AnalyzeCodeRequest(
                    entity.getLanguage(),
                    entity.getSourceCode(),
                    entity.getStandardInput()
            );

            AnalyzeCodeResponse response = new AnalyzeCodeResponse(
                    entity.getStatus(),
                    entity.getLanguage(),
                    diagnostics,
                    entity.getCompilerOutput(),
                    entity.getAiExplanation(),
                    entity.getHint()
            );

            return new AnalysisHistoryItem(request, response);
        } catch (JacksonException exception) {
            throw new IllegalStateException(
                    "Could not read saved analysis diagnostics",
                    exception
            );
        }
    }
}