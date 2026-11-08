
import "./style.css";
import * as monaco from "monaco-editor";

// ==================================================
// DEFAULT PROGRAMS
// ==================================================

const defaultPrograms = {
  JAVA: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,

  PYTHON: `print("Hello, World!")`,

  CPP: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!";
    return 0;
}`
};

// ==================================================
// LANGUAGE CONFIGURATION
// ==================================================

const monacoLanguages = {
  JAVA: "java",
  PYTHON: "python",
  CPP: "cpp"
};

// ==================================================
// ELEMENT REFERENCES
// ==================================================

const languageSelect = document.getElementById("language");
const resultBox = document.getElementById("result");
const aiAnalysis = document.getElementById("aiAnalysis");
const aiResponseForm = document.getElementById("ai-response-form");
const aiResponseInput = document.getElementById("ai-response-input");
const aiResponseSubmit = document.getElementById("ai-response-submit");
const programInput = document.getElementById("program-input");
const programsAnalyzedCount = document.getElementById("programs-analyzed-count");
const errorsDetectedCount = document.getElementById("errors-detected-count");

const analyzeButton = document.getElementById("analyze-button");
const resetButton = document.getElementById("reset-button");
const benchmarkSummary = document.getElementById("benchmark-summary");
const compareFirstProblem = document.getElementById("compare-first-problem");
const compareSecondProblem = document.getElementById("compare-second-problem");
const compareAlgorithmComplexityButton = document.getElementById("compare-algorithm-complexity");
const complexityGraphs = document.getElementById("complexity-graphs");

const editorElement = document.getElementById("editor");

let selectedProblem = null;
let currentAnalysisPayload = null;
let previousAiResponse = "";
let previousHintLevel = 0;
let studentReasoningHistory = [];

async function refreshAnalysisStats() {
  if (!programsAnalyzedCount || !errorsDetectedCount) return;
  try {
    const response = await fetch("/api/analyze/stats");
    if (!response.ok) throw new Error(`Stats request failed (HTTP ${response.status})`);
    const stats = await response.json();
    programsAnalyzedCount.textContent = String(stats.programsAnalyzed ?? 0);
    errorsDetectedCount.textContent = String(stats.errorsDetected ?? 0);
  } catch (error) {
    // Keep the dashboard usable while the backend is unavailable.
    console.error("Could not refresh analysis stats:", error);
  }
}

// ==================================================
// MONACO EDITOR
// ==================================================

const editor = monaco.editor.create(editorElement, {
  value: defaultPrograms.JAVA,
  language: "java",
  theme: "vs-dark",
  automaticLayout: true,
  minimap: {
    enabled: false
  },
  fontSize: 14,
  lineNumbers: "on",
  scrollBeyondLastLine: false,
  wordWrap: "on",
  roundedSelection: true,
  padding: {
    top: 12
  }
});

// Keep the editor editable while preventing clipboard copy, cut, and paste.
const editorDomNode = editor.getDomNode();
if (editorDomNode) {
  ["copy", "cut", "paste"].forEach(eventName => {
    editorDomNode.addEventListener(eventName, event => event.preventDefault(), true);
  });
  editorDomNode.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && ["c", "x", "v"].includes(event.key.toLowerCase())) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

editor.onDidChangeModelContent(() => {
});

// ==================================================
// LOAD CURRENT CODE
// ==================================================

function loadCurrentCode() {
  const language = languageSelect.value;

  const code = selectedProblem
    ? selectedProblem.starter[language]
    : defaultPrograms[language];

  monaco.editor.setModelLanguage(
    editor.getModel(),
    monacoLanguages[language]
  );

  editor.setValue(code);
}

// ==================================================
// AI DEBUGGER
// ==================================================

function resetAIAnalysis() {
  if (!aiAnalysis) return;

  currentAnalysisPayload = null;
  previousAiResponse = "";
  previousHintLevel = 0;
  studentReasoningHistory = [];
  if (aiResponseInput) aiResponseInput.value = "";
  if (aiResponseInput) aiResponseInput.disabled = true;
  if (aiResponseSubmit) aiResponseSubmit.disabled = true;

  aiAnalysis.textContent = "";

  const emptyState = document.createElement("div");
  emptyState.className = "ai-empty-state";

  const icon = document.createElement("div");
  icon.className = "ai-big-icon";
  icon.textContent = "✦";

  const heading = document.createElement("h3");
  heading.textContent = "AI Debugger Ready";

  const paragraph = document.createElement("p");
  paragraph.textContent =
    "Click Analyze Code to inspect your program and receive explanations.";

  emptyState.append(icon, heading, paragraph);
  aiAnalysis.appendChild(emptyState);
}

// ==================================================
// DISPLAY AI RESULT
// ==================================================

function displayAIAnalysis(data, studentReasoning = null) {
  if (!aiAnalysis) return;

  if (!studentReasoning) {
    aiAnalysis.textContent = "";
  } else {
    const studentReply = document.createElement("div");
    studentReply.className = "ai-student-reply";
    const studentLabel = document.createElement("strong");
    studentLabel.textContent = "Your reasoning";
    const studentText = document.createElement("p");
    studentText.textContent = studentReasoning;
    studentReply.append(studentLabel, studentText);
    aiAnalysis.appendChild(studentReply);
  }

  const wrapper = document.createElement("div");
  wrapper.className = "ai-result";

  const heading = document.createElement("h3");
  heading.textContent = "✦ AI Analysis";

  wrapper.appendChild(heading);

  if (data.diagnostics?.length) {
    const diagnosticHeading = document.createElement("h4");
    diagnosticHeading.textContent = "Compiler feedback";
    const diagnostics = document.createElement("ul");
    diagnostics.className = "compiler-feedback";
    data.diagnostics.forEach(diagnostic => {
      const item = document.createElement("li");
      const location = diagnostic.line > 0 ? `Line ${diagnostic.line}` : "Program";
      const kind = diagnostic.type?.toLowerCase().replaceAll("_", " ") ?? "diagnostic";
      item.textContent = `${location}: ${diagnostic.message} (${kind})`;
      diagnostics.appendChild(item);
    });
    wrapper.append(diagnosticHeading, diagnostics);
  }

  const explanation = document.createElement("p");
  explanation.textContent = data.aiExplanation;
  explanation.className = "ai-explanation-text";
  const hint = document.createElement("p");
  hint.textContent = `Your turn: ${data.hint}`;
  wrapper.append(explanation, hint);
  aiAnalysis.appendChild(wrapper);

  previousAiResponse = `${data.aiExplanation}\nFocused question: ${data.hint}`;
  const hintMatch = data.aiExplanation.match(/Hint\s+level(?:\s*\([^)]*\))?\s*:?\s*([0-5])\b/i);
  if (hintMatch) previousHintLevel = Math.max(previousHintLevel, Number(hintMatch[1]));

  const hasFocusedQuestion = Boolean(data.hint)
    && /Hint\s+level\s*:?\s*[0-5]\b/i.test(data.aiExplanation);
  const problemFocusLocked = Boolean(selectedProblem && !document.fullscreenElement);
  if (aiResponseInput) aiResponseInput.disabled = !hasFocusedQuestion || problemFocusLocked;
  if (aiResponseSubmit) aiResponseSubmit.disabled = !hasFocusedQuestion || problemFocusLocked;
  if (aiResponseInput && hasFocusedQuestion) {
    aiResponseInput.placeholder = "Share your thinking...";
  }
}

function displayTestCases(testCases = []) {
  const panel = document.getElementById("test-results-panel");
  const results = document.getElementById("test-results");
  const summary = document.getElementById("test-results-summary");
  if (!panel || !results || !summary) return;

  results.textContent = "";
  panel.hidden = !selectedProblem || testCases.length === 0;
  if (!testCases.length) return;

  const passedCount = testCases.filter(testCase => testCase.passed).length;
  summary.textContent = `${passedCount} of ${testCases.length} passed`;
  testCases.forEach(testCase => {
    const card = document.createElement("section");
    card.className = `test-case-result ${testCase.passed ? "passed" : "failed"}`;
    const title = document.createElement("h4");
    const status = document.createElement("span");
    status.className = `test-case-status ${testCase.passed ? "passed" : "failed"}`;
    status.setAttribute("aria-label", testCase.passed ? "Passed" : "Failed");
    status.textContent = testCase.passed ? "✓" : "✕";
    title.append(status, document.createTextNode(`Case ${testCase.caseNumber}: ${testCase.passed ? "Passed" : "Failed"}`));
    const details = document.createElement("pre");
    details.textContent = `Input:\n${testCase.input}\nExpected output:\n${testCase.expectedOutput}\nYour output:\n${testCase.actualOutput}\n${testCase.message}`;
    card.append(title, details);
    results.appendChild(card);
  });
}

// ==================================================
// DISPLAY ERROR
// ==================================================

function displayError(message) {
  if (!aiAnalysis) return;

  aiAnalysis.textContent = "";

  const wrapper = document.createElement("div");
  wrapper.className = "error-box";

  const heading = document.createElement("strong");
  heading.textContent = "Error";

  const paragraph = document.createElement("p");
  paragraph.textContent = message;

  wrapper.append(heading, paragraph);
  aiAnalysis.appendChild(wrapper);
}

// ==================================================
// LANGUAGE SWITCHING
// ==================================================

languageSelect.addEventListener("change", () => {
  loadCurrentCode();
});

// ==================================================
// RUN / ANALYZE BUTTON
// ==================================================

analyzeButton.addEventListener("click", async () => {
  if (selectedProblem && !document.fullscreenElement) {
    showFocusNotification("Open this problem in fullscreen focus mode to submit your solution.");
    await enterFocusMode();
    return;
  }

  const language = languageSelect.value;
  const code = editor.getValue();
  const input = programInput?.value ?? "";

  resultBox.textContent = "Analyzing...";

  resetAIAnalysis();
  displayTestCases([]);

  analyzeButton.disabled = true;
  analyzeButton.textContent = "Analyzing...";

  try {
    currentAnalysisPayload = {
      language,
      code,
      problemId: selectedProblem?.id ?? null,
      input,
      problemStatement: selectedProblem
        ? `${selectedProblem.title}\n${selectedProblem.description}\nInput: ${selectedProblem.input}\nOutput: ${selectedProblem.output}`
        : null
    };

    const response = await fetch("/api/analyze", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(currentAnalysisPayload)
    });

    const contentType =
      response.headers.get("content-type") || "";

    const data = contentType.includes("application/json")
      ? await response.json()
      : {
          error: await response.text()
        };

    if (!response.ok) {
      throw new Error(
        data.error || `Analysis failed (HTTP ${response.status})`
      );
    }

    resultBox.textContent =
      data.compilerOutput ||
      data.output ||
      "Program finished without producing output.";

    displayTestCases(data.testCases);
    if (selectedProblem?.complexity && data.testCases?.length
      && data.testCases.every(testCase => testCase.passed)) {
      rememberSolvedProblem(selectedProblem.id);
      populateSolvedProblemSelects();
    }
    displayAIAnalysis(data);
    await refreshAnalysisStats();

  } catch (error) {
    console.error("Analysis error:", error);

    resultBox.textContent = `Error: ${error.message}`;

    displayError(error.message);

  } finally {
    analyzeButton.disabled = Boolean(selectedProblem && !document.fullscreenElement);
    analyzeButton.textContent = "▶ Run";
  }
});

aiResponseForm?.addEventListener("submit", async event => {
  event.preventDefault();
  if (selectedProblem && !document.fullscreenElement) {
    showFocusNotification("Open this problem in fullscreen focus mode to continue.");
    await enterFocusMode();
    return;
  }
  const studentReasoning = aiResponseInput?.value.trim();
  if (!studentReasoning || !currentAnalysisPayload) return;

  aiResponseInput.disabled = true;
  aiResponseSubmit.disabled = true;
  aiResponseSubmit.textContent = "Thinking...";

  try {
    const latestAnalysisPayload = {
      ...currentAnalysisPayload,
      language: languageSelect.value,
      code: editor.getValue(),
      input: programInput.value
    };
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...latestAnalysisPayload,
        studentReasoning,
        studentReasoningHistory,
        previousAiResponse,
        previousHintLevel
      })
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : { error: await response.text() };
    if (!response.ok) {
      throw new Error(data.error || `AI response failed (HTTP ${response.status})`);
    }

    currentAnalysisPayload = latestAnalysisPayload;
    studentReasoningHistory = [...studentReasoningHistory, studentReasoning].slice(-8);
    resultBox.textContent = data.compilerOutput
      || data.output
      || "Program finished without producing output.";
    displayTestCases(data.testCases);
    displayAIAnalysis(data, studentReasoning);
    await refreshAnalysisStats();
    aiResponseInput.value = "";
  } catch (error) {
    const errorMessage = document.createElement("p");
    errorMessage.className = "ai-response-error";
    errorMessage.textContent = `Couldn't get an AI response: ${error.message}`;
    aiAnalysis.appendChild(errorMessage);
  } finally {
    aiResponseSubmit.textContent = "Send";
    const canContinue = /Focused question/i.test(previousAiResponse);
    const problemFocusLocked = Boolean(selectedProblem && !document.fullscreenElement);
    aiResponseInput.disabled = !canContinue || problemFocusLocked;
    aiResponseSubmit.disabled = !canContinue || problemFocusLocked;
    if (canContinue) aiResponseInput.focus();
  }
});

// ==================================================
// RESET BUTTON
// ==================================================

resetButton.addEventListener("click", () => {
  loadCurrentCode();

  programInput.value = "";
  displayTestCases([]);

  resultBox.textContent =
    "Your result will appear here.";

  resetAIAnalysis();
});

// ==================================================
// PROBLEM DATA
// ==================================================

function makeProblemStarter(algorithm, isSearch = false) {
  if (isSearch) {
    return {
      JAVA: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.nextInt();
        int[] values = new int[n];
        for (int i = 0; i < n; i++) values[i] = scanner.nextInt();
        int target = scanner.nextInt();

        // TODO: implement ${algorithm} and print the required index
    }
}`,
      PYTHON: `data = list(map(int, input().split()))
n = data[0]
values = data[1:1 + n]
target = data[1 + n]

# TODO: implement ${algorithm} and print the required index
`,
      CPP: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> values(n);
    for (int& value : values) cin >> value;
    int target;
    cin >> target;

    // TODO: implement ${algorithm} and print the required index
    return 0;
}`
    };
  }

  return {
    JAVA: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.nextInt();
        int[] values = new int[n];
        for (int i = 0; i < n; i++) values[i] = scanner.nextInt();

        // TODO: implement ${algorithm}
        // Print the sorted values separated by spaces.
    }
}`,
    PYTHON: `data = list(map(int, input().split()))
n = data[0]
values = data[1:1 + n]

# TODO: implement ${algorithm}
# Print the sorted values separated by spaces.
`,
    CPP: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> values(n);
    for (int& value : values) cin >> value;

    // TODO: implement ${algorithm}
    // Print the sorted values separated by spaces.
    return 0;
}`
  };
}

function complexityValue(growth, n) {
  switch (growth) {
    case "logn": return Math.log2(n);
    case "n": return n;
    case "nlogn": return n * Math.log2(n);
    case "n2": return n * n;
    default: return 1;
  }
}

function renderComplexityGraph(container, labelsContainer, comparedProblems) {
  const series = comparedProblems.map((problem, index) => ({
    problem,
    color: index === 0 ? "#a78bfa" : "#22d3ee"
  }));
  const sizes = [10, 100, 1000, 10000];
  const width = 620;
  const height = 280;
  const margin = { top: 18, right: 20, bottom: 46, left: 52 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const values = series.flatMap(item => sizes.map(size => complexityValue(item.problem.complexity.timeGrowth, size)));
  const minLog = Math.min(...values.map(value => Math.log10(value)));
  const maxLog = Math.max(...values.map(value => Math.log10(value)));
  const x = index => margin.left + (index / (sizes.length - 1)) * plotWidth;
  const y = value => margin.top + plotHeight - ((Math.log10(value) - minLog) / Math.max(1, maxLog - minLog)) * plotHeight;
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `Theoretical time complexity comparison for ${comparedProblems.map(problem => problem.title).join(" and ")}`);

  const axis = document.createElementNS(ns, "path");
  axis.setAttribute("d", `M ${margin.left} ${margin.top} V ${margin.top + plotHeight} H ${width - margin.right}`);
  axis.setAttribute("class", "benchmark-axis");
  svg.appendChild(axis);

  sizes.forEach((size, index) => {
    const label = document.createElementNS(ns, "text");
    label.textContent = size.toLocaleString();
    label.setAttribute("x", x(index));
    label.setAttribute("y", height - 20);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("class", "benchmark-label");
    svg.appendChild(label);
  });

  series.forEach(({ problem, color }) => {
    const coordinates = sizes.map((size, index) => `${x(index)},${y(complexityValue(problem.complexity.timeGrowth, size))}`);
    const line = document.createElementNS(ns, "polyline");
    line.setAttribute("points", coordinates.join(" "));
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", "3");
    svg.appendChild(line);
    sizes.forEach((size, index) => {
      const point = document.createElementNS(ns, "circle");
      point.setAttribute("cx", x(index));
      point.setAttribute("cy", y(complexityValue(problem.complexity.timeGrowth, size)));
      point.setAttribute("r", "4");
      point.setAttribute("fill", color);
      const title = document.createElementNS(ns, "title");
      title.textContent = `${problem.title} · n=${size} · ${problem.complexity.timeComplexity}`;
      point.appendChild(title);
      svg.appendChild(point);
    });
  });

  container.replaceChildren(svg);
  labelsContainer.replaceChildren(...series.map(({ problem, color }) => {
    const label = document.createElement("span");
    label.className = "complexity-legend-item";
    const swatch = document.createElement("i");
    swatch.style.backgroundColor = color;
    const text = document.createElement("span");
    text.textContent = `${problem.title}: ${problem.complexity.timeComplexity}`;
    label.append(swatch, text);
    return label;
  }));
}

function populateSolvedProblemSelects() {
  const solvedIds = readSolvedProblemIds();
  const solvedProblems = solvedIds
    .map(id => problems.find(problem => problem.id === id))
    .filter(problem => problem?.complexity);
  [compareFirstProblem, compareSecondProblem].forEach(select => {
    if (!select) return;
    const previousValue = select.value;
    const placeholder = select === compareSecondProblem ? "No comparison" : "Select a solved problem";
    select.replaceChildren(new Option(placeholder, ""));
    solvedProblems.forEach(problem => select.add(new Option(problem.title, problem.id)));
    if (solvedProblems.some(problem => problem.id === previousValue)) select.value = previousValue;
    else if (select === compareFirstProblem && solvedProblems.length) {
      select.value = solvedProblems.at(-1).id;
    }
  });
  if (compareAlgorithmComplexityButton) {
    compareAlgorithmComplexityButton.disabled = !compareFirstProblem.value
      || (compareSecondProblem.value && compareFirstProblem.value === compareSecondProblem.value);
  }
  if (complexityGraphs?.hidden && benchmarkSummary) {
    benchmarkSummary.textContent = solvedProblems.length
      ? "Choose a solved problem, then optionally add another"
      : "Pass all tests on a problem to enable its graph";
  }
}

function handleCompareSelectionChange() {
  complexityGraphs.hidden = true;
  populateSolvedProblemSelects();
}

compareFirstProblem?.addEventListener("change", handleCompareSelectionChange);
compareSecondProblem?.addEventListener("change", handleCompareSelectionChange);

compareAlgorithmComplexityButton?.addEventListener("click", () => {
  const first = problems.find(problem => problem.id === compareFirstProblem.value);
  const second = problems.find(problem => problem.id === compareSecondProblem.value);
  const solvedIds = readSolvedProblemIds();
  if (!first?.complexity || !solvedIds.includes(first.id)) return;
  const comparedProblems = [first];
  if (second?.complexity && second.id !== first.id && solvedIds.includes(second.id)) {
    comparedProblems.push(second);
  } else if (compareSecondProblem.value && compareSecondProblem.value === first.id) {
    return;
  }

  renderComplexityGraph(
    document.getElementById("time-complexity-chart"),
    document.getElementById("time-complexity-labels"),
    comparedProblems
  );
  benchmarkSummary.textContent = comparedProblems.length === 2
    ? `${first.title} (${first.complexity.timeComplexity}) vs ${second.title} (${second.complexity.timeComplexity})`
    : `${first.title}: ${first.complexity.timeComplexity}`;
  complexityGraphs.hidden = false;
  complexityGraphs.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

const complexityProfiles = {
  "sum-two-numbers": { timeComplexity: "O(1)", spaceComplexity: "O(1)", timeGrowth: "constant", spaceGrowth: "constant" },
  "reverse-string": { timeComplexity: "O(n)", spaceComplexity: "O(n)", timeGrowth: "n", spaceGrowth: "n" },
  "bubble-sort": { timeComplexity: "O(n²)", spaceComplexity: "O(1)", timeGrowth: "n2", spaceGrowth: "constant" },
  "selection-sort": { timeComplexity: "O(n²)", spaceComplexity: "O(1)", timeGrowth: "n2", spaceGrowth: "constant" },
  "insertion-sort": { timeComplexity: "O(n²) average/worst", spaceComplexity: "O(1)", timeGrowth: "n2", spaceGrowth: "constant" },
  "merge-sort": { timeComplexity: "O(n log n)", spaceComplexity: "O(n)", timeGrowth: "nlogn", spaceGrowth: "n" },
  "quick-sort": { timeComplexity: "O(n log n) average", spaceComplexity: "O(log n) average", timeGrowth: "nlogn", spaceGrowth: "logn" },
  "binary-search": { timeComplexity: "O(log n)", spaceComplexity: "O(1)", timeGrowth: "logn", spaceGrowth: "constant" },
  "first-occurrence": { timeComplexity: "O(log n)", spaceComplexity: "O(1)", timeGrowth: "logn", spaceGrowth: "constant" },
  "search-insert-position": { timeComplexity: "O(log n)", spaceComplexity: "O(1)", timeGrowth: "logn", spaceGrowth: "constant" }
};

const problems = [
  {
    id: "sum-two-numbers",
    title: "Sum of Two Numbers",
    difficulty: "Easy",
    description: "Read two integers and print their sum.",
    input: "Two integers separated by a space.",
    output: "Print their sum.",
    exampleInput: "2 3",
    exampleOutput: "5",
    complexity: complexityProfiles["sum-two-numbers"],

    starter: {
      JAVA: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        int a = scanner.nextInt();
        int b = scanner.nextInt();

        // TODO: print the sum of a and b
    }
}`,

      PYTHON: `a, b = map(int, input().split())

# TODO: print the sum of a and b
`,

      CPP: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;

    // TODO: print the sum of a and b

    return 0;
}`
    }
  },

  {
    id: "reverse-string",
    title: "Reverse a String",
    difficulty: "Easy",
    description: "Read a line of text and print it in reverse.",
    input: "One line of text.",
    output: "Print the text in reverse.",
    exampleInput: "hello",
    exampleOutput: "olleh",
    complexity: complexityProfiles["reverse-string"],

    starter: {
      JAVA: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        String text = scanner.nextLine();

        // TODO: print text in reverse
    }
}`,

      PYTHON: `text = input()

# TODO: print text in reverse
`,

      CPP: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string text;
    getline(cin, text);

    // TODO: reverse text and print it

    return 0;
}`
    }
  },
  ...[
    ["bubble-sort", "Bubble Sort", "Easy", "Sort integers in ascending order using bubble sort."],
    ["selection-sort", "Selection Sort", "Easy", "Sort integers in ascending order using selection sort."],
    ["insertion-sort", "Insertion Sort", "Easy", "Sort integers in ascending order using insertion sort."],
    ["merge-sort", "Merge Sort", "Medium", "Sort integers in ascending order using merge sort."],
    ["quick-sort", "Quick Sort", "Medium", "Sort integers in ascending order using quick sort."]
  ].map(([id, title, difficulty, description]) => ({
    id, title, difficulty, description,
    complexity: complexityProfiles[id],
    input: "An integer n followed by n integers.",
    output: "Print the n integers in ascending order, separated by spaces.",
    exampleInput: "5 5 1 4 2 8",
    exampleOutput: "1 2 4 5 8",
    starter: makeProblemStarter(title.toLowerCase())
  })),
  ...[
    ["binary-search", "Binary Search", "Easy", "Find a target in a sorted array. Print any matching zero-based index, or -1 if it is absent.", "6 1 3 5 7 9 11 7", "3", "binary search"],
    ["first-occurrence", "First Occurrence in a Sorted Array", "Medium", "Find the first zero-based index of a target in a sorted array, or print -1 if it is absent.", "7 1 2 2 2 4 7 9 2", "1", "binary search for the first occurrence"],
    ["search-insert-position", "Search Insert Position", "Easy", "Print the zero-based index of the target, or the index where it belongs to keep the array sorted.", "4 1 3 5 6 2", "1", "binary search for the insertion position"]
  ].map(([id, title, difficulty, description, exampleInput, exampleOutput, algorithm]) => ({
    id, title, difficulty, description,
    complexity: complexityProfiles[id],
    input: "An integer n, followed by n sorted integers and then the target.",
    output: "Print the required zero-based index.",
    exampleInput, exampleOutput,
    starter: makeProblemStarter(algorithm, true)
  }))
];

const recentActivityStorageKey = "codemind-recent-problems";
const solvedProblemsStorageKey = "codemind-solved-problems";
const recentActivityList = document.getElementById("recent-activity-list");

function readSolvedProblemIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(solvedProblemsStorageKey) || "[]");
    return Array.isArray(saved)
      ? [...new Set(saved.filter(id => typeof id === "string"
          && problems.some(problem => problem.id === id && problem.complexity)))]
      : [];
  } catch {
    return [];
  }
}

function rememberSolvedProblem(problemId) {
  try {
    const solvedIds = new Set(readSolvedProblemIds());
    solvedIds.add(problemId);
    localStorage.setItem(solvedProblemsStorageKey, JSON.stringify([...solvedIds]));
  } catch {
    // Keep analysis working when browser storage is unavailable.
  }
}

function readRecentProblemIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(recentActivityStorageKey) || "[]");
    return Array.isArray(saved)
      ? saved.filter(item => item && typeof item.id === "string"
          && problems.some(problem => problem.id === item.id))
      : [];
  } catch {
    return [];
  }
}

function renderRecentActivity() {
  if (!recentActivityList) return;

  const recentItems = readRecentProblemIds();
  recentActivityList.replaceChildren();

  if (!recentItems.length) {
    const emptyCard = document.createElement("div");
    emptyCard.className = "activity-card";
    const icon = document.createElement("div");
    icon.className = "activity-icon";
    icon.textContent = "◷";
    const message = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = "No recent activity";
    const detail = document.createElement("p");
    detail.textContent = "Problems you open to solve will appear here.";
    message.append(title, detail);
    emptyCard.append(icon, message);
    recentActivityList.appendChild(emptyCard);
    return;
  }

  recentItems.forEach(item => {
    const problem = problems.find(candidate => candidate.id === item.id);
    if (!problem) return;

    const activity = document.createElement("button");
    activity.type = "button";
    activity.className = "activity-card activity-item";
    activity.dataset.activityProblemId = problem.id;
    const icon = document.createElement("span");
    icon.className = "activity-icon";
    icon.textContent = "◷";
    const details = document.createElement("span");
    details.className = "activity-item-details";
    const title = document.createElement("strong");
    title.textContent = problem.title;
    const subtitle = document.createElement("span");
    subtitle.textContent = `${problem.difficulty} · Open in Code Lab`;
    details.append(title, subtitle);
    activity.append(icon, details);
    recentActivityList.appendChild(activity);
  });
}

function openProblem(problem) {
  if (!problem) return;
  selectedProblem = problem;
  setProblemFocusLock();

  const recentItems = readRecentProblemIds().filter(item => item.id !== problem.id);
  recentItems.unshift({ id: problem.id, openedAt: new Date().toISOString() });
  try {
    localStorage.setItem(recentActivityStorageKey, JSON.stringify(recentItems.slice(0, 5)));
  } catch {
    // Keep problem navigation working when browser storage is unavailable.
  }
  renderRecentActivity();

  document.getElementById("problem-title").textContent = problem.title;
  document.getElementById("problem-difficulty").textContent = problem.difficulty;
  document.getElementById("problem-description").textContent = problem.description;
  document.getElementById("problem-input-description").textContent = problem.input;
  document.getElementById("problem-output-description").textContent = problem.output;
  document.getElementById("problem-example-input").textContent = problem.exampleInput;
  document.getElementById("problem-example-output").textContent = problem.exampleOutput;
  document.getElementById("selected-problem").hidden = false;
  document.getElementById("practice-mode-button").hidden = true;

  loadCurrentCode();
  programInput.value = "";
  displayTestCases([]);
  resultBox.textContent = "Your result will appear here.";
  resetAIAnalysis();

  if (typeof window.showPage === "function") window.showPage("codeLab");
  enterFocusMode().then(entered => {
    if (entered) return;
    selectedProblem = null;
    document.getElementById("selected-problem").hidden = true;
    document.getElementById("practice-mode-button").hidden = false;
    setProblemFocusLock();
    loadCurrentCode();
    if (typeof window.showPage === "function") window.showPage("problems");
  });
}

function openPracticeMode() {
  if (document.fullscreenElement) {
    isFocusModeActive = false;
    document.exitFullscreen().catch(() => {});
  }
  selectedProblem = null;
  document.getElementById("selected-problem").hidden = true;
  document.getElementById("practice-mode-button").hidden = false;
  setProblemFocusLock();
  loadCurrentCode();
  programInput.value = "";
  displayTestCases([]);
  resultBox.textContent = "Your result will appear here.";
  resetAIAnalysis();
  if (typeof window.showPage === "function") window.showPage("codeLab");
}

populateSolvedProblemSelects();
renderRecentActivity();

if (recentActivityList) {
  recentActivityList.addEventListener("click", event => {
    const activity = event.target.closest("[data-activity-problem-id]");
    if (!activity) return;
    const problem = problems.find(item => item.id === activity.dataset.activityProblemId);
    openProblem(problem);
  });
}

// ==================================================
// DISPLAY PROBLEM CARDS
// ==================================================

const problemList = document.getElementById("problem-list");

if (problemList) {
  problemList.innerHTML = problems.map(problem => `
    <button
      class="problem-card"
      type="button"
      data-problem-id="${problem.id}"
    >
      <span class="difficulty-badge">
        ${problem.difficulty}
      </span>

      <h2>${problem.title}</h2>

      <p>${problem.description}</p>

      <span class="problem-card-link">
        Solve problem →
      </span>
    </button>
  `).join("");
}

// ==================================================
// FOCUS MODE
// ==================================================

let isFocusModeActive = false;
let notificationTimer = null;
let focusExitMessage = "You exited Focus Mode.";

function setProblemFocusLock() {
  const locked = Boolean(selectedProblem && !document.fullscreenElement);
  editor.updateOptions({ readOnly: locked });
  analyzeButton.disabled = locked;
  resetButton.disabled = locked;
  languageSelect.disabled = locked;
  programInput.disabled = locked;
  if (aiResponseInput) aiResponseInput.disabled = locked || !currentAnalysisPayload;
  if (aiResponseSubmit) aiResponseSubmit.disabled = locked || !currentAnalysisPayload;
  if (locked) {
  }
}

// ==================================================
// SHOW NOTIFICATION
// ==================================================

function showFocusNotification(message) {
  let notification = document.getElementById(
    "focus-notification"
  );

  if (!notification) {
    notification = document.createElement("div");

    notification.id = "focus-notification";
    notification.className = "focus-notification";

    document.body.appendChild(notification);
  }

  notification.textContent = message;

  notification.classList.add("show");

  if (notificationTimer) {
    clearTimeout(notificationTimer);
  }

  notificationTimer = setTimeout(() => {
    notification.classList.remove("show");
  }, 4000);
}

// ==================================================
// ENTER FOCUS MODE
// ==================================================

async function enterFocusMode() {

  if (document.fullscreenElement) {
    isFocusModeActive = true;
    setProblemFocusLock();
    return true;
  }

  try {

    isFocusModeActive = true;
    focusExitMessage = "You exited Focus Mode.";

    await document.documentElement.requestFullscreen();

    setProblemFocusLock();

    console.log("Focus Mode activated.");
    return true;

  } catch (error) {

    console.error("Fullscreen error:", error);

    isFocusModeActive = false;
    setProblemFocusLock();

    showFocusNotification(
      "Fullscreen is required to solve problems. Allow fullscreen, then open the problem again."
    );
    return false;
  }
}

// ==================================================
// DETECT FULLSCREEN EXIT
// PRESSING ESC RETURNS TO DASHBOARD
// ==================================================

document.addEventListener("fullscreenchange", () => {

  const isFullscreen = Boolean(
    document.fullscreenElement
  );

  // Fullscreen entered.

  if (isFullscreen) {
    isFocusModeActive = true;
    setProblemFocusLock();
    return;
  }

  setProblemFocusLock();

  // Fullscreen exited using ESC or browser controls.

  if (isFocusModeActive) {

    isFocusModeActive = false;

    // Navigate back to Dashboard.
    if (typeof window.showPage === "function") {
      window.showPage("dashboard");
    }

    // Show exit notification.
    showFocusNotification(
      focusExitMessage
    );
    focusExitMessage = "You exited Focus Mode.";

    console.log("Focus Mode exited.");

  }

});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && selectedProblem && document.fullscreenElement) {
    focusExitMessage = "Focus Mode exited because you switched tabs.";
    document.exitFullscreen().catch(error => {
      console.error("Could not exit fullscreen after tab switch:", error);
    });
  }
});

// ==================================================
// CODE LAB NAVIGATION
// ==================================================

// Navbar Code Lab

document.querySelectorAll(".nav-link[data-page]").forEach(link => {

  link.addEventListener("click", () => {

    if (link.dataset.page === "codeLab") {
      // Returning to Code Lab during a focused problem should only restore
      // the page view. Keep the selected problem and fullscreen session intact.
      if (selectedProblem && document.fullscreenElement) {
        window.showPage("codeLab");
        return;
      }
      openPracticeMode();
    }

  });

});

// Dashboard Open Code Lab button

const openCodeLabButton =
  document.getElementById("openCodeLab");

if (openCodeLabButton) {
  openCodeLabButton.addEventListener("click", () => {
    openPracticeMode();
  });
}

// Dashboard Quick Code Lab card

const quickCodeLabButton =
  document.getElementById("quickCodeLab");

if (quickCodeLabButton) {
  quickCodeLabButton.addEventListener("click", () => {
    openPracticeMode();
  });
}

document.getElementById("practice-mode-button")?.addEventListener("click", openPracticeMode);

// ==================================================
// SELECT A PROBLEM
// ==================================================

if (problemList) {

  problemList.addEventListener("click", event => {

    const card = event.target.closest(
      "[data-problem-id]"
    );

    if (!card) return;

    const problem = problems.find(item => item.id === card.dataset.problemId);
    openProblem(problem);

  });

}

// ==================================================
// BACK TO PROBLEMS
// ==================================================

const backToProblemsButton =
  document.getElementById("back-to-problems");

if (backToProblemsButton) {

  backToProblemsButton.addEventListener("click", () => {

    if (typeof window.showPage === "function") {
      window.showPage("problems");
    }

  });

}

// ==================================================
// INITIALIZE
// ==================================================

resetAIAnalysis();
refreshAnalysisStats();

console.log("CodeMind AI initialized successfully.");


/* ==================================================
   CODE LAB FULLSCREEN SESSION TIMER
   ================================================== */

let codeLabTimerInterval = null;
let codeLabTimerStartTime = null;
let codeLabElapsedSeconds = 0;

const codeLabTimer = document.createElement("div");

codeLabTimer.id = "code-lab-session-timer";

codeLabTimer.style.cssText = `
  position: fixed;
  top: 80px;
  right: 24px;
  z-index: 2147483647;
  display: none;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  background: #111827;
  border: 1px solid #818cf8;
  border-radius: 12px;
  color: white;
  font-family: Arial, sans-serif;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 5px 24px rgba(0, 0, 0, 0.4);
`;

codeLabTimer.innerHTML = `
  <span style="color: #a5b4fc;">
    ⏱ CODE LAB TIME
  </span>

  <span
    id="code-lab-timer-display"
    style="
      color: white;
      font-size: 18px;
      font-variant-numeric: tabular-nums;
    "
  >
    00:00:00
  </span>
`;

document.body.appendChild(codeLabTimer);

// Format elapsed seconds as HH:MM:SS
function formatCodeLabTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0")
  ].join(":");
}

// Update the timer display
function updateCodeLabTimer() {
  if (!codeLabTimerStartTime) return;

  const currentSessionSeconds = Math.floor(
    (Date.now() - codeLabTimerStartTime) / 1000
  );

  const totalSeconds =
    codeLabElapsedSeconds + currentSessionSeconds;

  const timerDisplay = document.getElementById(
    "code-lab-timer-display"
  );

  if (timerDisplay) {
    timerDisplay.textContent =
      formatCodeLabTime(totalSeconds);
  }
}

// Start timer when entering fullscreen
function startCodeLabTimer() {
  // Avoid starting a second timer
  if (codeLabTimerInterval) return;

  // Reset the timer for a new Focus Mode session
  codeLabElapsedSeconds = 0;
  codeLabTimerStartTime = Date.now();

  codeLabTimer.style.display = "flex";

  updateCodeLabTimer();

  codeLabTimerInterval = setInterval(() => {
    updateCodeLabTimer();
  }, 1000);
}

// Stop timer when leaving fullscreen
function stopCodeLabTimer() {
  if (codeLabTimerInterval) {
    clearInterval(codeLabTimerInterval);
    codeLabTimerInterval = null;
  }

  if (codeLabTimerStartTime) {
    codeLabElapsedSeconds += Math.floor(
      (Date.now() - codeLabTimerStartTime) / 1000
    );

    codeLabTimerStartTime = null;
  }

  codeLabTimer.style.display = "none";

  console.log(
    "Total Code Lab time:",
    formatCodeLabTime(codeLabElapsedSeconds)
  );
}

// Detect fullscreen entry and exit
document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement) {
    startCodeLabTimer();
  } else {
    stopCodeLabTimer();
  }
});
