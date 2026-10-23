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
      selectedProblem
        ? selectedProblem.starter[selectedLanguage]
        : defaultPrograms[selectedLanguage]
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


  const problems = [
    {
      id: "sum-two-numbers",
      title: "Sum of Two Numbers",
      difficulty: "Easy",
      description: "Read two integers and print their sum.",
      input: "Two integers separated by a space.",
      output: "Print their sum.",
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

  const problemList = document.getElementById("problem-list");

  problemList.innerHTML = problems.map(problem => `
    <button class="problem-card" type="button" data-problem-id="${problem.id}">
      <span class="difficulty-badge">${problem.difficulty}</span>
      <h2>${problem.title}</h2>
      <p>${problem.description}</p>
      <span class="problem-card-link">Solve problem →</span>
    </button>
  `).join("");

  let selectedProblem = null;

  problemList.addEventListener("click", event => {
    const card = event.target.closest("[data-problem-id]");
    if (!card) return;

    selectedProblem = problems.find(
      problem => problem.id === card.dataset.problemId
    );

    document.getElementById("problem-title").textContent = selectedProblem.title;
    document.getElementById("problem-difficulty").textContent =
      selectedProblem.difficulty;
    document.getElementById("problem-description").textContent =
      selectedProblem.description;
    document.getElementById("problem-input-description").textContent =
      selectedProblem.input;
    document.getElementById("problem-output-description").textContent =
      selectedProblem.output;
    document.getElementById("selected-problem").hidden = false;

    // Load the selected problem's starter code for the current language.
    const language = document.getElementById("language").value;
    editor.setValue(selectedProblem.starter[language]);

    window.showPage("codeLab");
  });

  document.getElementById("back-to-problems").addEventListener("click", () => {
    window.showPage("problems");
  });

