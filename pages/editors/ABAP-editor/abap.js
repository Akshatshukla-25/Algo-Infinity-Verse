// ABAP Editor — pages/editors/abap
// Client-side only: manual tokenizer for syntax highlighting (no external lib),
// example insertion, .abap open/save, and a simulated run (no real SAP system).

const STARTER_PROGRAM = `REPORT z_hello_world.

START-OF-SELECTION.
  WRITE: / 'Hello, ABAP!'.
`;

const KEYWORDS = [
  "REPORT","DATA","TYPES","BEGIN","END","WRITE","IF","ELSE","ELSEIF","ENDIF",
  "LOOP","AT","ENDLOOP","SELECT","SINGLE","PERFORM","FORM","ENDFORM","USING",
  "CHANGING","CALL","FUNCTION","METHOD","ENDMETHOD","CLASS","ENDCLASS","PUBLIC",
  "PRIVATE","PROTECTED","SECTION","METHODS","DO","ENDDO","TIMES","CASE","WHEN",
  "OTHERS","ENDCASE","MOVE","CONCATENATE","SPLIT","APPEND","CLEAR","REFRESH",
  "SORT","DELETE","MODIFY","INSERT","EXIT","CHECK","RETURN","TRY","CATCH",
  "ENDTRY","RAISE","EXCEPTION","EXCEPTIONS","PARAMETERS","SELECTION-SCREEN",
  "START-OF-SELECTION","END-OF-SELECTION","INITIALIZATION","DEFINITION",
  "IMPLEMENTATION","CREATE","OBJECT","EXPORTING","IMPORTING","RETURNING",
  "VALUE","TABLE","OCCURS","LIKE","LINE","OF","READ","APPENDING","CONSTANTS"
];

const ADDITIONS = [
  "FROM","INTO","WHERE","TO","GIVING","WITH","BY","ASCENDING","DESCENDING"
];

const SYSVARS = ["SY-SUBRC","SY-INDEX","SY-TABIX","SY-UNAME","SY-DATUM","SY-UZEIT","SY-MANDT"];

const EXAMPLES = [
  {
    title: "Hello World report",
    desc: "Minimal REPORT + WRITE",
    code: STARTER_PROGRAM
  },
  {
    title: "Internal table loop",
    desc: "SELECT into a table, LOOP AT",
    code: `REPORT z_customer_list.

DATA: lt_customers TYPE TABLE OF kna1,
      ls_customer  TYPE kna1.

START-OF-SELECTION.
  SELECT * FROM kna1
    INTO TABLE lt_customers
    WHERE land1 = 'US'.

  LOOP AT lt_customers INTO ls_customer.
    WRITE: / ls_customer-kunnr, ls_customer-name1.
  ENDLOOP.
`
  },
  {
    title: "FORM / PERFORM subroutine",
    desc: "Classic subroutine pattern",
    code: `REPORT z_subroutine_demo.

DATA: lv_result TYPE i.

START-OF-SELECTION.
  PERFORM calculate_square USING 5 CHANGING lv_result.
  WRITE: / 'Square:', lv_result.

FORM calculate_square USING    p_input  TYPE i
                       CHANGING p_output TYPE i.
  p_output = p_input * p_input.
ENDFORM.
`
  },
  {
    title: "Local class with method",
    desc: "OO ABAP class definition/implementation",
    code: `REPORT z_class_demo.

CLASS lcl_calculator DEFINITION.
  PUBLIC SECTION.
    METHODS: add
      IMPORTING iv_a TYPE i
                iv_b TYPE i
      RETURNING VALUE(rv_result) TYPE i.
ENDCLASS.

CLASS lcl_calculator IMPLEMENTATION.
  METHOD add.
    rv_result = iv_a + iv_b.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA: lo_calc TYPE REF TO lcl_calculator,
        lv_sum  TYPE i.

  CREATE OBJECT lo_calc.
  lv_sum = lo_calc->add( iv_a = 4 iv_b = 7 ).
  WRITE: / 'Sum:', lv_sum.
`
  }
];

const SNIPPETS = [
  {
    title: "IF / ENDIF",
    desc: "Conditional branch",
    code: `  IF lv_value > 0.
    WRITE: / 'Positive'.
  ELSE.
    WRITE: / 'Not positive'.
  ENDIF.`
  },
  {
    title: "LOOP AT / ENDLOOP",
    desc: "Iterate an internal table",
    code: `  LOOP AT lt_table INTO ls_line.
    WRITE: / ls_line.
  ENDLOOP.`
  },
  {
    title: "SELECT INTO TABLE",
    desc: "Read from a database table",
    code: `  SELECT * FROM ztable
    INTO TABLE lt_table
    WHERE field1 = 'X'.`
  },
  {
    title: "FORM / ENDFORM",
    desc: "Subroutine skeleton",
    code: `FORM my_subroutine USING p_input TYPE i.
  " logic here
ENDFORM.`
  },
  {
    title: "DATA declaration",
    desc: "Typed variable / internal table",
    code: `  DATA: lv_count TYPE i,
        lt_items TYPE TABLE OF string.`
  },
  {
    title: "WRITE statement",
    desc: "Output to the list",
    code: `  WRITE: / 'Label:', lv_value.`
  }
];

const codeInput = document.getElementById("codeInput");
const highlightCode = document.getElementById("highlightCode");
const highlightLayer = document.getElementById("highlightLayer");
const gutter = document.getElementById("gutter");
const outputBody = document.getElementById("outputBody");
const cursorPos = document.getElementById("cursorPos");
const fileNameInput = document.getElementById("fileName");
const languageSelect = document.getElementById("languageSelect");

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Tokenize a single line of ABAP for highlighting.
function highlightLine(line) {
  const trimmedStart = line.match(/^(\s*)(.*)$/);
  const leading = trimmedStart[1];
  const rest = trimmedStart[2];

  // Full-line comment: '*' as the first character.
  if (rest.startsWith("*")) {
    return escapeHtml(leading) + `<span class="tok-comment">${escapeHtml(rest)}</span>`;
  }

  // Split off trailing inline comment (unquoted '"')
  let code = rest;
  let comment = "";
  let inString = false;
  for (let i = 0; i < rest.length; i++) {
    const ch = rest[i];
    if (ch === "'" && !inString) inString = true;
    else if (ch === "'" && inString) inString = false;
    else if (ch === '"' && !inString) {
      code = rest.slice(0, i);
      comment = rest.slice(i);
      break;
    }
  }

  let html = "";
  const stringRe = /'(?:[^'\\]|\\.)*'/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = stringRe.exec(code)) !== null) {
    parts.push({ text: code.slice(lastIndex, match.index), isString: false });
    parts.push({ text: match[0], isString: true });
    lastIndex = stringRe.lastIndex;
  }
  parts.push({ text: code.slice(lastIndex), isString: false });

  for (const part of parts) {
    if (part.isString) {
      html += `<span class="tok-string">${escapeHtml(part.text)}</span>`;
      continue;
    }
    const tokenRe = /([A-Za-z][A-Za-z0-9_-]*)|(\d+(\.\d+)?)|(\s+)|([^\sA-Za-z0-9]+)/g;
    let m;
    while ((m = tokenRe.exec(part.text)) !== null) {
      const word = m[0];
      if (m[1]) {
        const upper = word.toUpperCase();
        if (SYSVARS.includes(upper)) {
          html += `<span class="tok-systemvar">${escapeHtml(word)}</span>`;
        } else if (KEYWORDS.includes(upper)) {
          html += `<span class="tok-kw">${escapeHtml(word)}</span>`;
        } else if (ADDITIONS.includes(upper)) {
          html += `<span class="tok-addition">${escapeHtml(word)}</span>`;
        } else {
          html += escapeHtml(word);
        }
      } else if (m[2]) {
        html += `<span class="tok-number">${escapeHtml(word)}</span>`;
      } else {
        html += escapeHtml(word);
      }
    }
  }

  if (comment) {
    html += `<span class="tok-comment">${escapeHtml(comment)}</span>`;
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

function loadIntoEditor(code, filename) {
  codeInput.value = code;
  if (filename) fileNameInput.value = filename;
  renderHighlight();
  updateCursorPos();
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

function buildPanels() {
  const exampleList = document.getElementById("exampleList");
  exampleList.innerHTML = "";
  EXAMPLES.forEach((ex) => {
    const btn = document.createElement("button");
    btn.className = "example-item";
    btn.innerHTML = `<span class="example-title">${ex.title}</span><span class="example-desc">${ex.desc}</span>`;
    btn.addEventListener("click", () => {
      const slug = ex.title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
      loadIntoEditor(ex.code, `z_${slug}.abap`);
    });
    exampleList.appendChild(btn);
  });

  const snippetList = document.getElementById("snippetList");
  snippetList.innerHTML = "";
  SNIPPETS.forEach((snippet) => {
    const btn = document.createElement("button");
    btn.className = "snippet-item";
    btn.innerHTML = `<span class="snippet-title">${snippet.title}</span><span class="snippet-desc">${snippet.desc}</span>`;
    btn.addEventListener("click", () => insertAtCursor(snippet.code));
    snippetList.appendChild(btn);
  });
}

// ---- Simulated run ----
// There is no real SAP system in the browser. We do a light static
// scan for required structural statements and simulate the list output
// of WRITE statements with literal string arguments.
function simulateRun() {
  const code = codeInput.value;
  const lines = [];

  const hasReport = /\bREPORT\s+\w/i.test(code);
  const hasWrite = /\bWRITE\s*:?/i.test(code);

  if (!hasReport) {
    lines.push({ text: "error: missing REPORT statement.", err: true });
  }
  if (!hasWrite) {
    lines.push({ text: "warning: no WRITE statement found — nothing will appear on the list.", err: true });
  }

  if (hasReport) {
    lines.push({ text: "generating... ok", err: false });

    const writeRe = /WRITE\s*:?\s*((?:\/?\s*(?:'[^']*'|[A-Za-z0-9_-]+)\s*,?\s*)+)\./gi;
    let match;
    let found = false;
    while ((match = writeRe.exec(code)) !== null) {
      found = true;
      const argsPart = match[1];
      const tokens = argsPart.match(/'[^']*'|[A-Za-z0-9_-]+/g) || [];
      const rendered = tokens
        .map((tok) => {
          if (/^'.*'$/.test(tok)) return tok.slice(1, -1);
          return `<${tok}>`; // unresolved variable reference in this simulation
        })
        .join(" ");
      lines.push({ text: rendered, err: false });
    }
    if (!found) {
      lines.push({ text: "(no literal WRITE output found — nothing printed)", err: false });
    }
    lines.push({ text: "report finished, sy-subrc = 0", err: false });
  }

  outputBody.innerHTML = lines
    .map((l) => `<div class="${l.err ? "err-line" : "ok-line"}">${escapeHtml(l.text)}</div>`)
    .join("");
}

// ---- File open / save ----
function downloadAbap() {
  const name = fileNameInput.value.trim() || "z_program.abap";
  const blob = new Blob([codeInput.value], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.endsWith(".abap") ? name : `${name}.abap`;
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
    loadIntoEditor(e.target.result, file.name);
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
  codeInput.value = value.slice(0, start) + "  " + value.slice(end);
  codeInput.selectionStart = codeInput.selectionEnd = start + 2;
  renderHighlight();
}

document.getElementById("loadStarterBtn").addEventListener("click", () => {
  loadIntoEditor(STARTER_PROGRAM, "z_hello_world.abap");
});

document.getElementById("runBtn").addEventListener("click", simulateRun);
document.getElementById("clearOutputBtn").addEventListener("click", () => {
  outputBody.textContent = "Output cleared.";
});
document.getElementById("downloadBtn").addEventListener("click", downloadAbap);
document.getElementById("fileUpload").addEventListener("change", handleFileUpload);

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
});

// This dropdown demonstrates that ABAP is registered as a selectable
// language option alongside the site's other editors. Wire the
// `change` handler up to the shared editor-index navigation once this
// page is integrated into pages/editors/.
languageSelect.addEventListener("change", (e) => {
  const chosen = e.target.value;
  if (chosen !== "abap") {
    console.info(`Navigate to the ${chosen} editor (hook up to real routing on integration).`);
  }
});

// ---- Init ----
buildPanels();
loadIntoEditor(STARTER_PROGRAM, "z_hello_world.abap");
