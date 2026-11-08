package debugger.code.agent.system.model;

import java.util.List;

public record ChartDataResponse(List<Integer> xAxis, List<SeriesDTO> series) {
    public ChartDataResponse {
        xAxis = List.copyOf(xAxis);
        series = List.copyOf(series);
    }
}
