 import "./style.css";
  import * as monaco from "monaco-editor";

  // Create the Monaco code editor inside <div id="editor">.
  const editor = monaco.editor.create(document.getElementById("editor"), {
    value: `public class Main {
      public static void main(String[] args) {
          System.out.println("Hello, World!");
      }
  }`,
    language: "java",
    theme: "vs-dark",
    automaticLayout: true
  });

  // When the language dropdown changes, update Monaco highlighting.
  document.getElementById("language").addEventListener("change", (event) => {
      const selectedLanguage = event.target.value;

      const monacoLanguage = {
        JAVA: "java",
        PYTHON: "python",
        CPP: "cpp"
      };

      // Change Monaco syntax highlighting for the
      selected language.monaco.editor.setModelLanguage(
        editor.getModel(),
        monacoLanguage[selectedLanguage]
      );

      // Show a suitable starter program for that
      language.editor.setValue(defaultPrograms[selectedLanguage]);
    });

  // Send the student's code to the Spring Boot API.
  document.getElementById("analyze-button").addEventListener("click", async () => {
    const resultBox = document.getElementById("result");

    resultBox.textContent = "Analyzing code...";

    try {
      const response = await fetch("/api/code/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          language: document.getElementById("language").value,
          code: editor.getValue(),
          input: document.getElementById("program-input").value
        })
      });

      const result = await response.json();

      resultBox.textContent = `
  Status: ${result.status}

  Compiler / Runtime Output:
  ${result.compilerOutput || "No output"}

  AI Explanation:
  ${result.aiExplanation || "No explanation"}

  Hint:
  ${result.hint || "No hint"}
      `.trim();
    } catch (error) {
      resultBox.textContent =
        "Could not connect to the Spring Boot backend. Ensure it is running on port 8080.";
    }
  });