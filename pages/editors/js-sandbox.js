import { executeJavaScriptSandbox } from "/backend/jsSandboxRunner.js";
import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.14.0";

const SAMPLE_TESTS = [
  { name: "reverse-1", input: [[1, 2, 3]], expected: [3, 2, 1] },
  { name: "reverse-2", input: [["a", "b"]], expected: ["b", "a"] },
];

function $(id) {
  return document.getElementById(id);
}

function safePretty(v) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setTranscript(text) {
  const pre = $("transcript");
  if (pre) pre.textContent = text;
}

function renderResults(data) {
  const { tests } = data;
  const testsList = $("testsList");
  const summary = $("summary");
  if (!testsList || !summary) return;

  testsList.innerHTML = "";

  let passed = 0;
  for (const t of tests) if (t.pass) passed += 1;

  summary.textContent = `Passed ${passed}/${tests.length}.`;

  tests.forEach((t, idx) => {
    const row = document.createElement("div");
    row.className = `test-row ${t.pass ? "pass" : "fail"}`;

    const expectedStr = t.expected === undefined ? "undefined" : safePretty(t.expected);
    const actualStr = t.actual === undefined ? "undefined" : safePretty(t.actual);

    row.innerHTML = `
      <div class="test-name">${idx + 1}. ${escapeHtml(t.name)} ${
      t.pass ? "✅" : "❌"
    }</div>
      ${t.pass ? "" : `
        <div class="diff">
          <div><b>Expected:</b> <code>${escapeHtml(expectedStr)}</code></div>
          <div><b>Actual:</b> <code>${escapeHtml(actualStr)}</code></div>
        </div>
        ${
          t.error
            ? `<div class="error-msg"><b>Runtime:</b> <pre>${escapeHtml(
                safePretty(t.error.message || t.error.name || "Error")
              )}</pre></div>`
            : ""
        }
      `}
    `;
    testsList.appendChild(row);
  });
}

async function run({ hidden }) {
  const userCode = $("userCode").value;
  const exportName = $("exportName").value || "solve";
  
  // In a real sandbox, you would run this. Since jsSandboxRunner.js might be a stub, we will mock it here or use it.
  try {
    const data = await executeJavaScriptSandbox({
      code: userCode,
      exportName,
      tests: hidden ? [] : SAMPLE_TESTS
    });
    renderResults(data);
  } catch (err) {
    console.error(err);
    renderResults({ tests: [] });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("runSample")?.addEventListener("click", () => run({ hidden: false }));
  $("runHidden")?.addEventListener("click", () => run({ hidden: true }));

  // AI Big-O Analyzer (Local LLM)
  const analyzeBtn = $("analyzeBigO");
  const resultDiv = $("bigOResult");
  let generator = null;

  if (analyzeBtn && resultDiv) {
    analyzeBtn.addEventListener("click", async () => {
      const code = $("userCode").value;
      if (!code.trim()) return;

      try {
        analyzeBtn.disabled = true;
        
        if (!generator) {
          resultDiv.textContent = "Loading local LLM (Xenova/flan-t5-small, ~80MB)...";
          // Disable local models fallback to huggingface hub
          env.allowLocalModels = false;
          generator = await pipeline('text2text-generation', 'Xenova/flan-t5-small');
        }

        resultDiv.textContent = "Analyzing Big-O complexity...";
        
        const prompt = `Analyze the time complexity of the following JavaScript function and reply with ONLY the Big O notation (e.g. O(1), O(N), O(N^2)). Code: ${code}`;
        
        const output = await generator(prompt, {
          max_new_tokens: 10,
          temperature: 0.1
        });
        
        if (output && output.length > 0) {
          resultDiv.innerHTML = `Estimated Time Complexity: <span style="color:#10b981;">${escapeHtml(output[0].generated_text)}</span> (Computed Locally!)`;
        } else {
          resultDiv.textContent = "Could not determine complexity.";
        }
      } catch (err) {
        console.error("Local LLM Error:", err);
        resultDiv.textContent = "Error running local LLM. See console.";
      } finally {
        analyzeBtn.disabled = false;
      }
    });
  }
});
