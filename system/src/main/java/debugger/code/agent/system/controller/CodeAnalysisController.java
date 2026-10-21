package debugger.code.agent.system.controller;

import debugger.code.agent.system.model.AnalysisHistoryItem;
import debugger.code.agent.system.model.AnalyzeCodeRequest;
import debugger.code.agent.system.model.AnalyzeCodeResponse;
import debugger.code.agent.system.service.AnalysisHistoryService;
import debugger.code.agent.system.service.CodeAnalysisService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class CodeAnalysisController {

    private final CodeAnalysisService analysisService;
    private final AnalysisHistoryService analysisHistoryService;

    public CodeAnalysisController(
            CodeAnalysisService analysisService,
            AnalysisHistoryService analysisHistoryService
    ) {
        this.analysisService = analysisService;
        this.analysisHistoryService = analysisHistoryService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<AnalyzeCodeResponse> analyze(
            @Valid @RequestBody AnalyzeCodeRequest request
    ) {
        AnalyzeCodeResponse response = analysisService.analyze(request);

        analysisHistoryService.save(request, response);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/analyze")
    public ResponseEntity<List<AnalysisHistoryItem>> getAllAnalyses() {
        return ResponseEntity.ok(analysisHistoryService.findAll());
    }
}
