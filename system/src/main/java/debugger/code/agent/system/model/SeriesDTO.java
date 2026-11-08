package debugger.code.agent.system.model;

import java.util.List;

public record SeriesDTO(String name, List<Double> data) {
    public SeriesDTO {
        data = List.copyOf(data);
    }
}
