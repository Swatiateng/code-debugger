package debugger.code.agent.system.model;

/** Lifetime totals for completed program analyses and analyses that found an issue. */
public record AnalysisStats(long programsAnalyzed, long errorsDetected) {
}
