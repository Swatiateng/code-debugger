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
const editor = monaco.editor.create(
  document.getElementById("editor"),
  {
    value: defaultPrograms.JAVA,
    language: "java",
    theme: "vs-dark",
    automaticLayout: true
  }
);

// Language switching
document
  .getElementById("language")
  .addEventListener("change", (event) => {

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

    editor.setValue(
      defaultPrograms[selectedLanguage]
    );
  });


// ==================================================
// ANALYZE BUTTON
// ==================================================

document.getElementById("analyze-button")
  .addEventListener("click", async () => {

    const resultBox =
      document.getElementById("result");

    const aiAnalysis =
      document.getElementById("aiAnalysis");

    const selectedLanguage =
      document.getElementById("language").value;

    const code =
      editor.getValue();

    resultBox.textContent =
      "Analyzing...";

    try {

      const programInput =
        document.getElementById("program-input")?.value ?? "";

      const response = await fetch(
        "/api/analyze",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            language: selectedLanguage,
            code: code,
            input: programInput
          })
        }
      );

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : { error: await response.text() };

      if (!response.ok) {
        throw new Error(
          data.error || `Analysis failed (HTTP ${response.status})`
        );
      }

      // Show the program output in the result panel.
      resultBox.textContent = data.compilerOutput ||
        "Program finished without producing output.";


      // Show AI analysis
      if (aiAnalysis) {

        aiAnalysis.innerHTML = `
          <div class="ai-result">

            <h3>🤖 AI Analysis</h3>

            <pre>${JSON.stringify(
              data,
              null,
              2
            )}</pre>

          </div>
        `;
      }

    } catch (error) {

      console.error(error);

      resultBox.textContent =
        `Error: ${error.message}`;

      if (aiAnalysis) {

        aiAnalysis.innerHTML = `
          <div class="error-box">

            <strong>🔴 Error</strong>

            <p>
              ${error.message}
            </p>

          </div>
        `;
      }
    }
  });


// ==================================================
// RESET BUTTON
// ==================================================

document
  .getElementById("reset-button")
  .addEventListener("click", () => {

    const selectedLanguage =
      document.getElementById("language").value;

    const monacoLanguage = {
      JAVA: "java",
      PYTHON: "python",
      CPP: "cpp"
    };

    monaco.editor.setModelLanguage(
      editor.getModel(),
      monacoLanguage[selectedLanguage]
    );

    editor.setValue(
      defaultPrograms[selectedLanguage]
    );

    document.getElementById("result").textContent =
      "Your result will appear here.";

    const aiAnalysis =
      document.getElementById("aiAnalysis");

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
