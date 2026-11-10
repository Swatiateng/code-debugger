package debugger.code.agent.system.controller;

import debugger.code.agent.system.model.ChartDataResponse;
import debugger.code.agent.system.service.ChartGenerationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/performance-charts")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://code-debugger-eight-delta.vercel.app"
})
public class PerformanceChartController {
    private final ChartGenerationService chartService;

    public PerformanceChartController(ChartGenerationService chartService) {
        this.chartService = chartService;
    }

    @GetMapping
    public ChartDataResponse getPerformanceChart(
            @RequestParam Long userId,
            @RequestParam(required = false) List<Long> problemIds,
            @RequestParam(required = false) Long currentProblemId
    ) {
        List<Long> ids = problemIds;
        if (ids == null || ids.isEmpty()) {
            if (currentProblemId == null) throw new IllegalArgumentException("Provide problemIds or currentProblemId.");
            ids = List.of(currentProblemId);
        }
        return chartService.generatePerformanceChart(userId, ids);
    }
}
