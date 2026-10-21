
package debugger.code.agent.system.model;

public record AnalysisHistoryItem(
        AnalyzeCodeRequest request,
        AnalyzeCodeResponse result
) {
}