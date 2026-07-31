// COBOL Editor — pages/editors/cobol
// Client-side only: manual tokenizer for syntax highlighting (no external lib),
// snippet insertion, .cbl open/save, and a simulated run (no real compiler).

const STARTER_PROGRAM = `      IDENTIFICATION DIVISION.
       PROGRAM-ID. HELLO-WORLD.
       AUTHOR. ALGO-INFINITY-VERSE.

       ENVIRONMENT DIVISION.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-GREETING       PIC X(20) VALUE "Hello, COBOL!".
       01  WS-COUNTER        PIC 9(2)  VALUE 0.

       PROCEDURE DIVISION.
       MAIN-PARAGRAPH.
           DISPLAY WS-GREETING
           PERFORM VARYING WS-COUNTER FROM 1 BY 1
               UNTIL WS-COUNTER > 3
               DISPLAY "Iteration: " WS-COUNTER
           END-PERFORM
           STOP RUN.
`;

const KEYWORDS = [
  "IDENTIFICATION","ENVIRONMENT","DATA","PROCEDURE","DIVISION","SECTION",
  "PROGRAM-ID","AUTHOR","WORKING-STORAGE","FILE","INPUT-OUTPUT","CONFIGURATION",
  "MOVE","TO","DISPLAY","ACCEPT","PERFORM","VARYING","FROM","BY","UNTIL",
  "END-PERFORM","IF","ELSE","END-IF","EVALUATE","WHEN","END-EVALUATE",
  "ADD","SUBTRACT","MULTIPLY","DIVIDE","GIVING","COMPUTE","STOP","RUN",
  "OPEN","CLOSE","READ","WRITE","REWRITE","DELETE","CALL","USING",
  "PIC","PICTURE","VALUE","OCCURS","REDEFINES","SELECT","ASSIGN",
  "ORGANIZATION","FD","SD","INITIALIZE","STRING","UNSTRING","INSPECT",
  "GO","CONTINUE","NEXT","SENTENCE","THRU","THROUGH","NOT","GREATER",
  "LESS","THAN","EQUAL","AND","OR","INTO"
];

const DIVISION_SKELETON = [
  "IDENTIFICATION DIVISION.",
  "PROGRAM-ID.",
  "ENVIRONMENT DIVISION.",
  "DATA DIVISION.",
  "WORKING-STORAGE SECTION.",
  "PROCEDURE DIVISION."
];

const SNIPPETS = [
  {
    title: "IF / ELSE",
    desc: "Conditional branch",
    code: `           IF WS-VALUE > 0
               DISPLAY "Positive"
           ELSE
               DISPLAY "Not positive"
           END-IF`
  },
  {
    title: "PERFORM loop",
    desc: "Counted loop",
    code: `           PERFORM VARYING WS-I FROM 1 BY 1 UNTIL WS-I > 10
               DISPLAY WS-I
           END-PERFORM`
  },
  {
    title: "DISPLAY",
    desc: "Print to console",
    code: `           DISPLAY "Value: " WS-VALUE`
  },
  {
    title: "MOVE",
    desc: "Assign a value",
    code: `           MOVE 0 TO WS-COUNTER`
  },
  {
    title: "Working-storage field",
    desc: "Declare a variable",
    code: `       01  WS-NAME            PIC X(30) VALUE SPACES.`
  },
  {
    title: "File SELECT",
    desc: "Basic file I/O setup",
    code: `           SELECT CUSTOMER-FILE ASSIGN TO "CUSTOMER.DAT"
               ORGANIZATION IS LINE SEQUENTIAL.`
  },
  {
    title: "EVALUATE",
    desc: "Multi-branch switch",
    code: `           EVALUATE WS-CODE
               WHEN 1
                   DISPLAY "One"
               WHEN 2
                   DISPLAY "Two"
               WHEN OTHER
                   DISPLAY "Other"
           END-EVALUATE`
  }
];

const codeInput = document.getElementById("codeInput");
const highlightCode = document.getElementById("highlightCode");
const highlightLayer = document.getElementById("highlightLayer");
const gutter = document.getElementById("gutter");
const outputBody = document.getElementById("outputBody");
const cursorPos = document.getElementById("cursorPos");
const fileNameInput = document.getElementById("fileName");

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Tokenize a single line of COBOL for highlighting.
function highlightLine(line) {
  // Comment line: '*' in column 7 (classic fixed-format) — we approximate
  // by treating any line whose first non-space char is '*' as a comment.
  const trimmedStart = line.match(/^(\s*)(.*)$/);
  const leading = trimmedStart[1];
  const rest = trimmedStart[2];

  if (rest.startsWith("*")) {
    return escapeHtml(leading) + `<span class="tok-comment">${escapeHtml(rest)}</span>`;
  }

  let html = "";
  const stringRe = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = stringRe.exec(line)) !== null) {
    parts.push({ text: line.slice(lastIndex, match.index), isString: false });
    parts.push({ text: match[0], isString: true });
    lastIndex = stringRe.lastIndex;
  }
  parts.push({ text: line.slice(lastIndex), isString: false });

  for (const part of parts) {
    if (part.isString) {
      html += `<span class="tok-string">${escapeHtml(part.text)}</span>`;
      continue;
    }
    const tokenRe = /([A-Za-z][A-Za-z0-9-]*)|(\d+(\.\d+)?)|(\.)|(\s+)|([^\sA-Za-z0-9.]+)/g;
    let m;
    while ((m = tokenRe.exec(part.text)) !== null) {
      const word = m[0];
      if (m[1]) {
        const upper = word.toUpperCase();
        if (["IDENTIFICATION","ENVIRONMENT","DATA","PROCEDURE","DIVISION"].includes(upper)) {
          html += `<span class="tok-div">${escapeHtml(word)}</span>`;
        } else if (KEYWORDS.includes(upper)) {
          html += `<span class="tok-kw">${escapeHtml(word)}</span>`;
        } else if (/^[A-Z0-9-]+$/i.test(word) && word === word.toUpperCase() && word.includes("-")) {
          html += `<span class="tok-paragraph">${escapeHtml(word)}</span>`;
        } else {
          html += escapeHtml(word);
        }
      } else if (m[2]) {
        html += `<span class="tok-number">${escapeHtml(word)}</span>`;
      } else if (m[4]) {
        html += `<span class="tok-period">${escapeHtml(word)}</span>`;
      } else {
        html += escapeHtml(word);
      }
    }
  }

  return escapeHtml(leading) + html;
}

function renderHighlight() {
  const lines = codeInput.value.split("\n");
  highlightCode.innerHTML = lines.map(highlightLine).join("\n") + "\n";
  renderGutter(lines.length);
}

function renderGutter(lineCount) {
  let html = "";
  for (let i = 1; i <= lineCount; i++) {
    html += `<div>${i}</div>`;
  }
  gutter.innerHTML = html;
}

function syncScroll() {
  highlightLayer.scrollTop = codeInput.scrollTop;
  highlightLayer.scrollLeft = codeInput.scrollLeft;
  gutter.scrollTop = codeInput.scrollTop;
}

function updateCursorPos() {
  const value = codeInput.value;
  const pos = codeInput.selectionStart;
  const upToCursor = value.slice(0, pos);
  const line = upToCursor.split("\n").length;
  const col = pos - upToCursor.lastIndexOf("\n");
  cursorPos.textContent = `Ln ${line}, Col ${col}`;
}

function insertAtCursor(text) {
  const start = codeInput.selectionStart;
  const end = codeInput.selectionEnd;
  const value = codeInput.value;
  const needsLeadingNewline = start > 0 && value[start - 1] !== "\n";
  const insertion = (needsLeadingNewline ? "\n" : "") + text + "\n";
  codeInput.value = value.slice(0, start) + insertion + value.slice(end);
  const newPos = start + insertion.length;
  codeInput.selectionStart = codeInput.selectionEnd = newPos;
  codeInput.focus();
  renderHighlight();
  updateCursorPos();
}

function buildSnippetPanel() {
  const list = document.getElementById("snippetList");
  list.innerHTML = "";
  SNIPPETS.forEach((snippet) => {
    const btn = document.createElement("button");
    btn.className = "snippet-item";
    btn.innerHTML = `<span class="snippet-title">${snippet.title}</span><span class="snippet-desc">${snippet.desc}</span>`;
    btn.addEventListener("click", () => insertAtCursor(snippet.code));
    list.appendChild(btn);
  });

  const chipWrap = document.getElementById("divisionChips");
  chipWrap.innerHTML = "";
  DIVISION_SKELETON.forEach((line) => {
    const chip = document.createElement("button");
    chip.className = "division-chip";
    chip.textContent = line;
    chip.addEventListener("click", () => insertAtCursor("       " + line));
    chipWrap.appendChild(chip);
  });
}

// ---- Simulated run ----
// There is no real COBOL compiler in the browser. We do a light static
// scan for obviously missing required divisions/paragraph terminators
// and, if the starter-shaped DISPLAY/PERFORM pattern is present, we
// simulate the expected console output so the editor still feels alive.
function simulateRun() {
  const code = codeInput.value;
  const lines = [];

  const hasIdDivision = /IDENTIFICATION\s+DIVISION/i.test(code);
  const hasProcDivision = /PROCEDURE\s+DIVISION/i.test(code);
  const hasStopRun = /STOP\s+RUN/i.test(code);

  if (!hasIdDivision) {
    lines.push({ text: "error: missing IDENTIFICATION DIVISION.", err: true });
  }
  if (!hasProcDivision) {
    lines.push({ text: "error: missing PROCEDURE DIVISION.", err: true });
  }
  if (!hasStopRun) {
    lines.push({ text: "warning: no STOP RUN found — program may not terminate cleanly.", err: true });
  }

  if (hasIdDivision && hasProcDivision) {
    lines.push({ text: "compiling... ok", err: false });

    const displayRe = /DISPLAY\s+((?:"[^"]*"|'[^']*'|[A-Za-z0-9-]+)(?:\s+(?:"[^"]*"|'[^']*'|[A-Za-z0-9-]+))*)/gi;
    let match;
    let found = false;
    while ((match = displayRe.exec(code)) !== null) {
      found = true;
      const rendered = match[1]
        .match(/"[^"]*"|'[^']*'|[A-Za-z0-9-]+/g)
        .map((tok) => {
          if (/^["'].*["']$/.test(tok)) return tok.slice(1, -1);
          return `<${tok}>`; // unresolved variable reference in this simulation
        })
        .join("");
      lines.push({ text: rendered, err: false });
    }
    if (!found) {
      lines.push({ text: "(no DISPLAY statements found — nothing printed)", err: false });
    }
    lines.push({ text: "program exited normally", err: false });
  }

  outputBody.innerHTML = lines
    .map((l) => `<div class="${l.err ? "err-line" : "ok-line"}">${escapeHtml(l.text)}</div>`)
    .join("");
}

// ---- File open / save ----
function downloadCbl() {
  const name = fileNameInput.value.trim() || "program.cbl";
  const blob = new Blob([codeInput.value], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.endsWith(".cbl") || name.endsWith(".cob") ? name : `${name}.cbl`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function handleFileUpload(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    codeInput.value = e.target.result;
    fileNameInput.value = file.name;
    renderHighlight();
  };
  reader.readAsText(file);
  evt.target.value = "";
}

// ---- Wiring ----
codeInput.addEventListener("input", renderHighlight);
codeInput.addEventListener("scroll", syncScroll);
codeInput.addEventListener("keyup", updateCursorPos);
codeInput.addEventListener("click", updateCursorPos);
codeInput.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    insertPlainTab();
  }
});

function insertPlainTab() {
  const start = codeInput.selectionStart;
  const end = codeInput.selectionEnd;
  const value = codeInput.value;
  codeInput.value = value.slice(0, start) + "    " + value.slice(end);
  codeInput.selectionStart = codeInput.selectionEnd = start + 4;
  renderHighlight();
}

document.getElementById("loadStarterBtn").addEventListener("click", () => {
  codeInput.value = STARTER_PROGRAM;
  fileNameInput.value = "hello-world.cbl";
  renderHighlight();
  updateCursorPos();
});

document.getElementById("runBtn").addEventListener("click", simulateRun);
document.getElementById("clearOutputBtn").addEventListener("click", () => {
  outputBody.textContent = "Output cleared.";
});
document.getElementById("downloadBtn").addEventListener("click", downloadCbl);
document.getElementById("fileUpload").addEventListener("change", handleFileUpload);

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
});

// ---- Init ----
codeInput.value = STARTER_PROGRAM;
buildSnippetPanel();
renderHighlight();
updateCursorPos();
