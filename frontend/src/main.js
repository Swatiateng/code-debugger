
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
const programInput = document.getElementById("program-input");

const analyzeButton = document.getElementById("analyze-button");
const resetButton = document.getElementById("reset-button");

const editorElement = document.getElementById("editor");

let selectedProblem = null;

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

function displayAIAnalysis(data) {
  if (!aiAnalysis) return;

  aiAnalysis.textContent = "";

  const wrapper = document.createElement("div");
  wrapper.className = "ai-result";

  const heading = document.createElement("h3");
  heading.textContent = "✦ AI Analysis";

  wrapper.appendChild(heading);

  if (data.diagnostics?.length) {
    const diagnostics = document.createElement("pre");
    diagnostics.textContent = JSON.stringify(data.diagnostics, null, 2);
    wrapper.appendChild(diagnostics);
  }

  const explanation = document.createElement("p");
  explanation.textContent = data.aiExplanation;
  const hint = document.createElement("p");
  hint.textContent = `Hint: ${data.hint}`;
  wrapper.append(explanation, hint);
  aiAnalysis.appendChild(wrapper);
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
  const language = languageSelect.value;
  const code = editor.getValue();
  const input = programInput?.value ?? "";

  resultBox.textContent = "Analyzing...";

  resetAIAnalysis();
  displayTestCases([]);

  analyzeButton.disabled = true;
  analyzeButton.textContent = "Analyzing...";

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        language,
        code,
        problemId: selectedProblem?.id ?? null,
        input
      })
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
    displayAIAnalysis(data);

  } catch (error) {
    console.error("Analysis error:", error);

    resultBox.textContent = `Error: ${error.message}`;

    displayError(error.message);

  } finally {
    analyzeButton.disabled = false;
    analyzeButton.textContent = "▶ Run";
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
  }
];

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
    return;
  }

  try {

    isFocusModeActive = true;

    await document.documentElement.requestFullscreen();

    console.log("Focus Mode activated.");

  } catch (error) {

    console.error("Fullscreen error:", error);

    isFocusModeActive = false;

    showFocusNotification(
      "Fullscreen could not start. Please try again."
    );
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
    return;
  }

  // Fullscreen exited using ESC or browser controls.

  if (isFocusModeActive) {

    isFocusModeActive = false;

    // Navigate back to Dashboard.
    if (typeof window.showPage === "function") {
      window.showPage("dashboard");
    }

    // Show exit notification.
    showFocusNotification(
      "You exited Focus Mode."
    );

    console.log("Focus Mode exited.");

  }

});

// ==================================================
// CODE LAB NAVIGATION
// ==================================================

// Navbar Code Lab

document.querySelectorAll(".nav-link[data-page]").forEach(link => {

  link.addEventListener("click", () => {

    if (link.dataset.page === "codeLab") {
      enterFocusMode();
    }

  });

});

// Dashboard Open Code Lab button

const openCodeLabButton =
  document.getElementById("openCodeLab");

if (openCodeLabButton) {
  openCodeLabButton.addEventListener("click", () => {
    enterFocusMode();
  });
}

// Dashboard Quick Code Lab card

const quickCodeLabButton =
  document.getElementById("quickCodeLab");

if (quickCodeLabButton) {
  quickCodeLabButton.addEventListener("click", () => {
    enterFocusMode();
  });
}

// ==================================================
// SELECT A PROBLEM
// ==================================================

if (problemList) {

  problemList.addEventListener("click", event => {

    const card = event.target.closest(
      "[data-problem-id]"
    );

    if (!card) return;

    selectedProblem = problems.find(
      problem => problem.id === card.dataset.problemId
    );

    if (!selectedProblem) return;

    document.getElementById("problem-title").textContent =
      selectedProblem.title;

    document.getElementById("problem-difficulty").textContent =
      selectedProblem.difficulty;

    document.getElementById("problem-description").textContent =
      selectedProblem.description;

    document.getElementById("problem-input-description").textContent =
      selectedProblem.input;

    document.getElementById("problem-output-description").textContent =
      selectedProblem.output;
    document.getElementById("problem-example-input").textContent =
      selectedProblem.exampleInput;
    document.getElementById("problem-example-output").textContent =
      selectedProblem.exampleOutput;

    document.getElementById("selected-problem").hidden = false;

    loadCurrentCode();

    programInput.value = "";
    displayTestCases([]);

    resultBox.textContent =
      "Your result will appear here.";

    resetAIAnalysis();

    // Navigate to Code Lab.

    if (typeof window.showPage === "function") {
      window.showPage("codeLab");
    }

    // Enter fullscreen.

    enterFocusMode();

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
