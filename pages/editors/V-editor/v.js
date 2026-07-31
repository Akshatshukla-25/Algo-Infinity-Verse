// V Language Editor — pages/editors/v
// Client-side only: manual tokenizer for syntax highlighting (no external lib),
// template insertion, .v open/save, and a simulated run (no real V compiler).

const STARTER_PROGRAM = `module main

fn main() {
	println('Hello, V!')
}
`;

const KEYWORDS = [
  "MODULE","IMPORT","FN","STRUCT","ENUM","INTERFACE","MUT","PUB","CONST",
  "RETURN","IF","ELSE","FOR","IN","MATCH","DEFER","GO","SPAWN","UNSAFE",
  "ORELSE","OR","BREAK","CONTINUE","IS","AS","SIZEOF","TYPEOF","NONE",
  "TRUE","FALSE","TYPE","UNION","EMBED","STATIC","SHARED","ATOMIC",
  "LOCK","RLOCK","SELECT","ASSERT","__GLOBAL","GOTO"
];

const TYPES = [
  "INT","I8","I16","I32","I64","I128","U8","U16","U32","U64","U128",
  "F32","F64","BOOL","STRING","RUNE","BYTE","BYTEPTR","VOIDPTR","ANY",
  "MAP","ARRAY","CHAN","THREAD","ERROR"
];

const EXAMPLES = [
  {
    title: "Hello World",
    desc: "Minimal module + main function",
    code: STARTER_PROGRAM
  },
  {
    title: "Variables & mutability",
    desc: "mut keyword and basic types",
    code: `module main

fn main() {
	name := 'V language'
	mut count := 0

	for count < 5 {
		count++
	}

	println('Language: ' + name)
	println('Count reached: ' + count.str())
}
`
  },
  {
    title: "Struct example",
    desc: "Define and use a struct",
    code: `module main

struct Point {
	x int
	y int
}

fn (p Point) distance_from_origin() f64 {
	return math.sqrt(f64(p.x * p.x + p.y * p.y))
}

fn main() {
	p := Point{ x: 3, y: 4 }
	println('Point: (' + p.x.str() + ', ' + p.y.str() + ')')
	println('Distance: ' + p.distance_from_origin().str())
}
`
  },
  {
    title: "Array iteration",
    desc: "for-in loop over a fixed array",
    code: `module main

fn main() {
	numbers := [1, 2, 3, 4, 5]
	mut total := 0

	for n in numbers {
		total += n
	}

	println('Sum: ' + total.str())
}
`
  },
  {
    title: "Multiple return values",
    desc: "A V-specific function feature",
    code: `module main

fn divide(a int, b int) (int, int) {
	return a / b, a % b
}

fn main() {
	quotient, remainder := divide(17, 5)
	println('Quotient: ' + quotient.str())
	println('Remainder: ' + remainder.str())
}
`
  }
];

const SNIPPETS = [
  {
    title: "fn definition",
    desc: "Function with typed params",
    code: `fn add(a int, b int) int {
	return a + b
}`
  },
  {
    title: "struct definition",
    desc: "Struct with typed fields",
    code: `struct User {
	name string
	age  int
}`
  },
  {
    title: "for loop",
    desc: "Condition-based loop",
    code: `	mut i := 0
	for i < 10 {
		println(i.str())
		i++
	}`
  },
  {
    title: "IF / ELSE",
    desc: "Conditional branch",
    code: `	if x > 0 {
		println('Positive')
	} else {
		println('Not positive')
	}`
  },
  {
    title: "match expression",
    desc: "V's pattern-matching switch",
    code: `	match day {
		1 { println('Monday') }
		2 { println('Tuesday') }
		else { println('Some other day') }
	}`
  },
  {
    title: "array / map declaration",
    desc: "Common collection literals",
    code: `	names := ['Ada', 'Grace', 'Alan']
	ages := map[string]int{'Ada': 36, 'Grace': 85}`
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

// Tokenize a single line of V for highlighting.
function highlightLine(line) {
  const trimmedStart = line.match(/^(\s*)(.*)$/);
  const leading = trimmedStart[1];
  const rest = trimmedStart[2];

  if (rest.startsWith("//")) {
    return escapeHtml(leading) + `<span class="tok-comment">${escapeHtml(rest)}</span>`;
  }

  // Split off trailing inline comment (unquoted '//')
  let code = rest;
  let comment = "";
  let inString = false;
  let quoteChar = "";
  for (let i = 0; i < rest.length - 1; i++) {
    const ch = rest[i];
    if (ch === "\\" && inString) { i++; continue; }
    if ((ch === "'" || ch === '"') && !inString) { inString = true; quoteChar = ch; }
    else if (ch === quoteChar && inString) { inString = false; }
    else if (ch === "/" && rest[i + 1] === "/" && !inString) {
      code = rest.slice(0, i);
      comment = rest.slice(i);
      break;
    }
  }

  // Attribute lines like [inline] / [deprecated]
  const attrMatch = code.match(/^(\[[A-Za-z_][A-Za-z0-9_: ]*\])/);
  let attrHtml = "";
  if (attrMatch) {
    attrHtml = `<span class="tok-attr">${escapeHtml(attrMatch[1])}</span>`;
    code = code.slice(attrMatch[1].length);
  }

  let html = "";
  const stringRe = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g;
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
      // Highlight $var / ${expr} interpolation inside the string.
      const interpRe = /\$\{[^}]*\}|\$[A-Za-z_][A-Za-z0-9_.]*/g;
      let strHtml = "";
      let strLast = 0;
      let interpMatch;
      while ((interpMatch = interpRe.exec(part.text)) !== null) {
        strHtml += escapeHtml(part.text.slice(strLast, interpMatch.index));
        strHtml += `<span class="tok-interp">${escapeHtml(interpMatch[0])}</span>`;
        strLast = interpRe.lastIndex;
      }
      strHtml += escapeHtml(part.text.slice(strLast));
      html += `<span class="tok-string">${strHtml}</span>`;
      continue;
    }
    const tokenRe = /([A-Za-z_][A-Za-z0-9_]*)|(\d+(\.\d+)?)|(\s+)|([^\sA-Za-z0-9]+)/g;
    let m;
    while ((m = tokenRe.exec(part.text)) !== null) {
      const word = m[0];
      if (m[1]) {
        const upper = word.toUpperCase();
        if (TYPES.includes(upper)) {
          html += `<span class="tok-type">${escapeHtml(word)}</span>`;
        } else if (KEYWORDS.includes(upper)) {
          html += `<span class="tok-kw">${escapeHtml(word)}</span>`;
        } else if (word === "fn") {
          html += `<span class="tok-fn">${escapeHtml(word)}</span>`;
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

  return escapeHtml(leading) + attrHtml + html;
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
      loadIntoEditor(ex.code, `${slug}.v`);
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
// There is no real V compiler in the browser. We do a light static
// scan for a main() function and simulate console output for
// println(...)/print(...) calls with literal string arguments.
function simulateRun() {
  const code = codeInput.value;
  const lines = [];

  const hasMain = /\bfn\s+main\s*\(\s*\)/.test(code);
  const hasPrint = /\b(println|print)\s*\(/.test(code);

  if (!hasMain) {
    lines.push({ text: "error: missing fn main() entry point.", err: true });
  }
  if (!hasPrint) {
    lines.push({ text: "note: no println()/print() calls found — nothing will print.", err: true });
  }

  if (hasMain) {
    lines.push({ text: "compiling... ok", err: false });

    const printRe = /(println|print)\s*\(\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g;
    let match;
    let found = false;
    while ((match = printRe.exec(code)) !== null) {
      found = true;
      let text = match[2].slice(1, -1);
      // Resolve $var / ${expr} interpolation into a placeholder for this simulation.
      text = text.replace(/\$\{[^}]*\}|\$[A-Za-z_][A-Za-z0-9_.]*/g, (m) => `<${m.replace(/^\$\{?|\}$/g, "")}>`);
      lines.push({ text, err: false });
    }
    if (!found && hasPrint) {
      lines.push({ text: "(print calls build strings at runtime — showing static text only)", err: false });
    }
    lines.push({ text: "process exited with code 0", err: false });
  }

  outputBody.innerHTML = lines
    .map((l) => `<div class="${l.err ? "err-line" : "ok-line"}">${escapeHtml(l.text)}</div>`)
    .join("");
}

// ---- File open / save ----
function downloadV() {
  const name = fileNameInput.value.trim() || "main.v";
  const blob = new Blob([codeInput.value], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.endsWith(".v") ? name : `${name}.v`;
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
  reader.onerror = () => {
    outputBody.innerHTML = `<div class="err-line">${escapeHtml("error: failed to read file " + file.name)}</div>`;
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
  if (e.key === "Escape") {
    codeInput.blur();
  }
});

function insertPlainTab() {
  const start = codeInput.selectionStart;
  const end = codeInput.selectionEnd;
  const value = codeInput.value;
  codeInput.value = value.slice(0, start) + "\t" + value.slice(end);
  codeInput.selectionStart = codeInput.selectionEnd = start + 1;
  renderHighlight();
}

document.getElementById("loadStarterBtn").addEventListener("click", () => {
  loadIntoEditor(STARTER_PROGRAM, "hello_world.v");
});

document.getElementById("runBtn").addEventListener("click", simulateRun);
document.getElementById("clearOutputBtn").addEventListener("click", () => {
  outputBody.textContent = "Output cleared.";
});
document.getElementById("downloadBtn").addEventListener("click", downloadV);
document.getElementById("fileUpload").addEventListener("change", handleFileUpload);

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
});

// This dropdown demonstrates that V is registered as a selectable
// language option alongside the site's other editors. Wire the
// `change` handler up to the shared editor-index navigation once this
// page is integrated into pages/editors/.
languageSelect.addEventListener("change", (e) => {
  const chosen = e.target.value;
  if (chosen !== "v") {
    console.info(`Navigate to the ${chosen} editor (hook up to real routing on integration).`);
  }
});

// ---- Init ----
buildPanels();
loadIntoEditor(STARTER_PROGRAM, "hello_world.v");
