import "./style.css";
import * as monaco from "monaco-editor";

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

// Create the Monaco code editor
const editor = monaco.editor.create(document.getElementById("editor"), {
  value: defaultPrograms.JAVA,
  language: "java",
  theme: "vs-dark",
  automaticLayout: true
});

// Language switching
document.getElementById("language").addEventListener("change", (event) => {
  const selectedLanguage = event.target.value;

  const monacoLanguage = {
    JAVA: "java",
    PYTHON: "python",
    CPP: "cpp"
  };

  monaco.editor.setModelLanguage(
    editor.getModel(),
    monacoLanguage[selectedLanguage]
  );

  editor.setValue(defaultPrograms[selectedLanguage]);
});

// Run button
document.getElementById("analyze-button").addEventListener("click", () => {
  const resultBox = document.getElementById("result");
  const aiAnalysis = document.getElementById("aiAnalysis");

  // Execution result
  resultBox.textContent = `
Status: Error

Compiler / Runtime Output:
Error: variable 'x' is not defined

Execution stopped.

AI Explanation:
The program contains an error that needs to be fixed.

Hint:
Check whether the variable is declared before it is used.
`.trim();

  // AI Debugger
  if (aiAnalysis) {
    aiAnalysis.innerHTML = `
      <div class="ai-result">

        <h3>🤖 AI Analysis</h3>

        <div class="line-explanation">
          <strong>1.</strong>
          This line starts the program execution.
        </div>

        <div class="line-explanation">
          <strong>2.</strong>
          This line creates and processes the program data.
        </div>

        <div class="error-box">
          <strong>3. 🔴 ERROR</strong>
          <p>
            <strong>Problem:</strong>
            The variable is being used before it is declared.
          </p>

          <p>
            <strong>Why:</strong>
            The program cannot find the required variable.
          </p>
        </div>

        <div class="hint-box">
          <strong>💡 Hint</strong>
          <p>
            Check the variable declaration before using it.
          </p>
        </div>

        <div class="fix-box">
          <strong>✅ Suggested Fix</strong>
          <p>
            Declare the variable before using it.
          </p>
        </div>

        <div class="line-explanation">
          <strong>4.</strong>
          After fixing the variable, run the program again.
        </div>

      </div>
    `;
  }
});

// Reset button
document.getElementById("reset-button").addEventListener("click", () => {
  const selectedLanguage = document.getElementById("language").value;

  const monacoLanguage = {
    JAVA: "java",
    PYTHON: "python",
    CPP: "cpp"
  };

  monaco.editor.setModelLanguage(
    editor.getModel(),
    monacoLanguage[selectedLanguage]
  );

  editor.setValue(defaultPrograms[selectedLanguage]);

  document.getElementById("result").textContent =
    "Your result will appear here.";

  const aiAnalysis = document.getElementById("aiAnalysis");

  if (aiAnalysis) {
    aiAnalysis.innerHTML = `
      <div class="ai-empty">
        <div class="ai-icon">🤖</div>
        <h3>AI Debugger Ready</h3>
        <p>
          Run your code to receive AI-powered
          explanations, error analysis and hints.
        </p>
      </div>
    `;
  }
});