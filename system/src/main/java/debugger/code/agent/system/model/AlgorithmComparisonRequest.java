
package debugger.code.agent.system.model;

import jakarta.validation.constraints.NotBlank;

public record AlgorithmComparisonRequest(
        @NotBlank String algorithm1,
        @NotBlank String code1,
        @NotBlank String algorithm2,
        @NotBlank String code2,
        @NotBlank String language
) {
}
