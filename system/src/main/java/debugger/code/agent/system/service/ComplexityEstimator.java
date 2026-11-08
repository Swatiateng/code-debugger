package debugger.code.agent.system.service;

import java.util.Arrays;
import java.util.List;

/** Estimates a growth class by fitting candidate curves to measured runtimes. */
public final class ComplexityEstimator {
    private ComplexityEstimator() { }

    private record Candidate(String label, java.util.function.DoubleUnaryOperator curve) { }
    private static final List<Candidate> CANDIDATES = List.of(
            new Candidate("O(1)", n -> 1.0),
            new Candidate("O(log N)", n -> Math.log(n)),
            new Candidate("O(N)", n -> n),
            new Candidate("O(N log N)", n -> n * Math.log(n)),
            new Candidate("O(N²)", n -> n * n)
    );

    public static String estimate(int[] inputSizes, double[] executionTimesMs) {
        if (inputSizes == null || executionTimesMs == null || inputSizes.length != executionTimesMs.length || inputSizes.length < 2) {
            throw new IllegalArgumentException("At least two paired input sizes and runtimes are required.");
        }
        for (int i = 0; i < inputSizes.length; i++) {
            if (inputSizes[i] <= 0 || !Double.isFinite(executionTimesMs[i]) || executionTimesMs[i] < 0) {
                throw new IllegalArgumentException("Input sizes must be positive and runtimes finite and non-negative.");
            }
        }
        if (Arrays.stream(inputSizes).distinct().count() < 2) {
            throw new IllegalArgumentException("At least two distinct input sizes are required.");
        }

        Candidate best = null;
        double lowestError = Double.POSITIVE_INFINITY;
        for (Candidate candidate : CANDIDATES) {
            double[] x = Arrays.stream(inputSizes).mapToDouble(candidate.curve()::applyAsDouble).toArray();
            double error = regressionSse(x, executionTimesMs);
            if (error < lowestError) {
                lowestError = error;
                best = candidate;
            }
        }
        return best.label();
    }

    private static double regressionSse(double[] x, double[] y) {
        double meanX = Arrays.stream(x).average().orElse(0);
        double meanY = Arrays.stream(y).average().orElse(0);
        double covariance = 0, variance = 0;
        for (int i = 0; i < x.length; i++) {
            covariance += (x[i] - meanX) * (y[i] - meanY);
            variance += (x[i] - meanX) * (x[i] - meanX);
        }
        double slope = variance == 0 ? 0 : Math.max(0, covariance / variance);
        double intercept = meanY - slope * meanX;
        double sse = 0;
        for (int i = 0; i < x.length; i++) {
            double residual = y[i] - (intercept + slope * x[i]);
            sse += residual * residual;
        }
        return sse;
    }
}
