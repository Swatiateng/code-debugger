package debugger.code.agent.system.controller;

import debugger.code.agent.system.model.AnalyzeCodeRequest;
import debugger.code.agent.system.model.AnalyzeCodeResponse;
import debugger.code.agent.system.service.CodeAnalysisService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
// Think of this class as the receptionist of the project:
// it receives a student's request from the website and gives the final result back.
@RequestMapping("/api/code")
// This prefix groups all code-related URLs under /api/code.
public class CodeAnalysisController {
    // This is the "expert team" the receptionist calls to actually inspect the student's code.
    private final CodeAnalysisService codeAnalysisService;
    // Spring creates the expert team once and gives it to this controller when the app starts.
    public CodeAnalysisController(CodeAnalysisService codeAnalysisService) { this.codeAnalysisService = codeAnalysisService; }

    @GetMapping("/")
    // This is the simple "Is the project running?" page for a browser or frontend developer.
    public Map<String, String> home() {
        // We return two short pieces of information instead of creating a separate Java class for them.
        return Map.of(
                "status", "Code analysis service is running.",
                "analyzeEndpoint", "POST /api/code/analyze"
        );
    }

    @PostMapping("/analyze")
    // POST is used because a student can send a large block of source code in the request body.
    public ResponseEntity<AnalyzeCodeResponse> analyze(@Valid @RequestBody AnalyzeCodeRequest request) {
        // Spring reads the submitted JSON and stores it in 'request'.
        // @Valid rejects an empty program or a missing language before any compiler is started.
        // The service does the real work; this controller stays small and only manages the web request.
        return ResponseEntity.ok(codeAnalysisService.analyze(request));
    }
}
