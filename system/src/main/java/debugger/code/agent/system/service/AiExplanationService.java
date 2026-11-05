package debugger.code.agent.system.service;

import debugger.code.agent.system.model.AiExplanation;
import debugger.code.agent.system.model.Language;
import debugger.code.agent.system.model.TestCaseResult;

import java.util.List;

public interface AiExplanationService {

    AiExplanation explain(
            Language language,
            String sourceCode,
            String compilerOutput,
            String problemStatement,
            List<TestCaseResult> failedTestCases,
            String studentReasoning,
            String previousAiResponse,
            Integer previousHintLevel,
            List<String> studentReasoningHistory
    );
}
