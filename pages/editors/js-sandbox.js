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
  
  try {
    const data = await executeJavaScriptSandbox({
      code: userCode,
      exportName,
      tests: hidden ? [] : SAMPLE_TESTS
    });
    renderResults(data);
    
    // Also run Time-Travel Debugger on the first test case
    if (!hidden) {
      runTimeTravelDebugger(userCode, exportName, SAMPLE_TESTS[0].input);
    }
  } catch (err) {
    console.error(err);
    renderResults({ tests: [] });
  }
}

// --- Time-Travel Debugger (AST Instrumentation) ---
let ttdSnapshots = [];

function instrumentCode(code) {
  try {
    const ast = window.acorn.parse(code, { ecmaVersion: 2020 });
    
    // A simple recursive AST walker to inject snapshot captures
    function walk(node) {
      if (!node) return;
      
      // Inject snapshot after variable declarations or assignments
      if (node.type === 'BlockStatement') {
        const newBody = [];
        for (let i = 0; i < node.body.length; i++) {
          const stmt = node.body[i];
          newBody.push(stmt);
          if (stmt.type === 'VariableDeclaration' || stmt.type === 'ExpressionStatement' || stmt.type === 'ReturnStatement') {
            newBody.push({
              type: 'ExpressionStatement',
              expression: {
                type: 'CallExpression',
                callee: { type: 'Identifier', name: '_captureSnapshot' },
                arguments: [
                  { type: 'Literal', value: stmt.loc ? stmt.loc.start.line : 0 },
                  { type: 'Identifier', name: 'arguments' }
                ]
              }
            });
          }
        }
        node.body = newBody;
      }
      
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          walk(node[key]);
        }
      }
    }
    
    walk(ast);
    return window.escodegen.generate(ast);
  } catch (e) {
    console.error("AST Instrumentation failed:", e);
    // Fallback: very basic manual injection or just return code if parsing fails
    return code;
  }
}

function runTimeTravelDebugger(code, funcName, inputArgs) {
  ttdSnapshots = [];
  const status = $("ttdStatus");
  const scrubBar = $("ttdScrubBar");
  const playBtn = $("ttdPlayBtn");
  const stepDisplay = $("ttdStepDisplay");
  
  status.textContent = "Instrumenting AST...";
  
  // We use a mock instrumentation here that captures arguments and local state if possible
  // For the sake of the MVP, we will evaluate the code in a sandbox function wrapper
  
  window._captureSnapshot = function(line, args) {
    // Attempt to clone local state
    let state = {};
    try {
      state = { ...args };
    } catch(e) {}
    
    ttdSnapshots.push({
      line,
      state: JSON.stringify(state, null, 2),
      stack: (new Error().stack || "").split('\\n').slice(2, 5).join('\\n')
    });
  };

  try {
    const instrumented = instrumentCode(code);
    const runFunc = new Function(`
      ${instrumented};
      if (typeof ${funcName} === 'function') {
        return ${funcName}.apply(null, arguments[0]);
      }
    `);
    
    runFunc(inputArgs);
    
    if (ttdSnapshots.length > 0) {
      status.textContent = `Captured ${ttdSnapshots.length} snapshots!`;
      scrubBar.max = ttdSnapshots.length - 1;
      scrubBar.value = 0;
      scrubBar.disabled = false;
      playBtn.disabled = false;
      updateTTDUI(0);
    } else {
      status.textContent = "No snapshots captured (did the function run?)";
    }
  } catch (e) {
    status.textContent = "Time-travel execution failed.";
    console.error(e);
  }
}

function updateTTDUI(index) {
  if (!ttdSnapshots[index]) return;
  const snap = ttdSnapshots[index];
  $("ttdStepDisplay").textContent = `Step ${index + 1}/${ttdSnapshots.length}`;
  $("ttdVariables").textContent = snap.state || "(Empty)";
  $("ttdCallStack").textContent = snap.stack || "(Empty)";
}

document.addEventListener("DOMContentLoaded", () => {
  $("ttdScrubBar")?.addEventListener("input", (e) => {
    updateTTDUI(parseInt(e.target.value));
  });
  
  let playing = false;
  let playInterval;
  $("ttdPlayBtn")?.addEventListener("click", () => {
    const btn = $("ttdPlayBtn");
    const scrub = $("ttdScrubBar");
    playing = !playing;
    
    if (playing) {
      btn.innerHTML = '<i class="fas fa-pause"></i>';
      playInterval = setInterval(() => {
        let val = parseInt(scrub.value);
        if (val >= parseInt(scrub.max)) {
          clearInterval(playInterval);
          playing = false;
          btn.innerHTML = '<i class="fas fa-play"></i>';
          return;
        }
        scrub.value = val + 1;
        updateTTDUI(val + 1);
      }, 500);
    } else {
      btn.innerHTML = '<i class="fas fa-play"></i>';
      clearInterval(playInterval);
    }
  });

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
