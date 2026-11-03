
package debugger.code.agent.system.controller;

import debugger.code.agent.system.model.AlgorithmComparisonRequest;
import debugger.code.agent.system.service.AlgorithmComparisonService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/compare")
@CrossOrigin(origins = "http://localhost:5173")
public class AlgorithmComparisonController {

    private final AlgorithmComparisonService comparisonService;

    public AlgorithmComparisonController(
            AlgorithmComparisonService comparisonService) {
        this.comparisonService = comparisonService;
    }

    @PostMapping("/algorithms")
    public ResponseEntity<Map<String, Object>> compareAlgorithms(
            @Valid @RequestBody AlgorithmComparisonRequest request)
            throws Exception {

        Map<String, Object> result =
                comparisonService.compareAlgorithms(request);

        return ResponseEntity.ok(result);
    }
}
