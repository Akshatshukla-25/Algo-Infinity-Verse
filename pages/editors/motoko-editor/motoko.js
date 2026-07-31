// Motoko Editor — pages/editors/motoko
// Client-side only: manual tokenizer for syntax highlighting (no external lib),
// template insertion, .mo open/save, and a simulated deploy (no real IC replica).

const STARTER_PROGRAM = `actor {
  public func greet(name : Text) : async Text {
    return "Hello, " # name # "!";
  };
};
`;

const KEYWORDS = [
  "ACTOR","CLASS","FUNC","PUBLIC","PRIVATE","QUERY","UPDATE","SHARED",
  "ASYNC","AWAIT","LET","VAR","IF","ELSE","SWITCH","CASE","FOR","WHILE",
  "LOOP","RETURN","TYPE","MODULE","IMPORT","OBJECT","AND","OR","NOT",
  "TRUE","FALSE","NULL","IGNORE","ASSERT","TRY","CATCH","THROW","DO",
  "LABEL","BREAK","CONTINUE","STABLE","PERSISTENT","SYSTEM","DEBUG",
  "THIS","IN","TO","FROM","WITH","IS"
];

const TYPES = [
  "NAT","NAT8","NAT16","NAT32","NAT64","INT","INT8","INT16","INT32",
  "INT64","FLOAT","BOOL","CHAR","TEXT","BLOB","PRINCIPAL","ARRAY",
  "OPTION","RESULT","HASHMAP","BUFFER","LIST"
];

const EXAMPLES = [
  {
    title: "Hello World actor",
    desc: "Minimal actor with a public function",
    code: STARTER_PROGRAM
  },
  {
    title: "Counter with stable state",
    desc: "Increment/read a counter that survives upgrades",
    code: `actor Counter {
  stable var count : Nat = 0;

  public func increment() : async Nat {
    count += 1;
    return count;
  };

  public query func getCount() : async Nat {
    return count;
  };

  public func reset() : async () {
    count := 0;
  };
};
`
  },
  {
    title: "Key-value store",
    desc: "put/get over a stable array of pairs",
    code: `import Array "mo:base/Array";

actor KeyValueStore {
  stable var entries : [(Text, Text)] = [];

  public func put(key : Text, value : Text) : async () {
    entries := Array.append(entries, [(key, value)]);
  };

  public query func get(key : Text) : async ?Text {
    for ((k, v) in entries.vals()) {
      if (k == key) {
        return ?v;
      };
    };
    return null;
  };

  public query func size() : async Nat {
    return entries.size();
  };
};
`
  },
  {
    title: "Actor class with init args",
    desc: "Parameterized actor constructor pattern",
    code: `actor class Greeter(defaultName : Text) {
  stable var lastGreeted : Text = defaultName;

  public func greet(name : Text) : async Text {
    lastGreeted := name;
    return "Hello, " # name # "! (via actor class)";
  };

  public query func whoWasLastGreeted() : async Text {
    return lastGreeted;
  };
};
`
  }
];

const SNIPPETS = [
  {
    title: "public func",
    desc: "Update call (state-changing)",
    code: `  public func setValue(newValue : Nat) : async () {
    value := newValue;
  };`
  },
  {
    title: "query func",
    desc: "Fast read-only call",
    code: `  public query func getValue() : async Nat {
    return value;
  };`
  },
  {
    title: "let / var declaration",
    desc: "Immutable vs mutable binding",
    code: `  let maxRetries : Nat = 3;
  var attempts : Nat = 0;`
  },
  {
    title: "switch / case",
    desc: "Pattern matching",
    code: `  switch (result) {
    case (?value) { return value; };
    case (null) { return 0; };
  };`
  },
  {
    title: "for loop",
    desc: "Iterate over a collection",
    code: `  for (item in items.vals()) {
    Debug.print(debug_show(item));
  };`
  },
  {
    title: "stable var",
    desc: "State that survives canister upgrades",
    code: `  stable var totalCalls : Nat = 0;`
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

// Tokenize a single line of Motoko for highlighting.
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
  for (let i = 0; i < rest.length - 1; i++) {
    const ch = rest[i];
    if (ch === '"' && !inString) inString = true;
    else if (ch === '"' && inString) inString = false;
    else if (ch === "/" && rest[i + 1] === "/" && !inString) {
      code = rest.slice(0, i);
      comment = rest.slice(i);
      break;
    }
  }

  let html = "";
  const stringRe = /"(?:[^"\\]|\\.)*"/g;
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
    const tokenRe = /([A-Za-z_][A-Za-z0-9_]*)|(\d+(\.\d+)?)|(\s+)|([^\sA-Za-z0-9]+)/g;
    let m;
    while ((m = tokenRe.exec(part.text)) !== null) {
      const word = m[0];
      if (m[1]) {
        const upper = word.toUpperCase();
        if (upper === "ACTOR") {
          html += `<span class="tok-actor">${escapeHtml(word)}</span>`;
        } else if (TYPES.includes(upper)) {
          html += `<span class="tok-type">${escapeHtml(word)}</span>`;
        } else if (KEYWORDS.includes(upper)) {
          html += `<span class="tok-kw">${escapeHtml(word)}</span>`;
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
      loadIntoEditor(ex.code, `${slug}.mo`);
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

// ---- Simulated deploy ----
// There is no real Motoko compiler or IC replica in the browser. We do a
// light static scan for the required `actor` declaration and generate a
// simplified Candid-style interface listing from public function signatures.
function simulateRun() {
  const code = codeInput.value;
  const lines = [];

  const hasActor = /\bactor\b/.test(code);
  const hasPublicFunc = /public\s+(query\s+)?func/.test(code);

  if (!hasActor) {
    lines.push({ text: "error: no actor declaration found.", err: true });
  }
  if (!hasPublicFunc) {
    lines.push({ text: "warning: no public functions found — canister will expose no methods.", err: false, warn: true });
  }

  if (hasActor) {
    lines.push({ text: "compiling with moc (simulated)... ok", err: false });

    const actorMatch = code.match(/actor(?:\s+class)?\s+(\w+)?/);
    const actorName = actorMatch && actorMatch[1] ? actorMatch[1] : "(anonymous)";
    lines.push({ text: `actor ${actorName} compiled successfully`, err: false });

    const fnRe = /public\s+(query\s+)?func\s+(\w+)\s*\(([^)]*)\)\s*:\s*async\s+([^\{]+)\{/g;
    let match;
    let found = false;
    lines.push({ text: "Generated Candid interface:", err: false });
    while ((match = fnRe.exec(code)) !== null) {
      found = true;
      const [, isQuery, name, params, returnType] = match;
      const kind = isQuery ? "query" : "update";
      lines.push({ text: `  ${name} : (${params.trim()}) -> (${returnType.trim()}) ${kind}` });
    }
    if (!found) {
      lines.push({ text: "  (no public functions found)", err: false });
    }
    lines.push({ text: "canister deployed to local replica (simulated), 0 errors", err: false });
  }

  outputBody.innerHTML = lines
    .map((l) => `<div class="${l.err ? "err-line" : l.warn ? "warn-line" : "ok-line"}">${escapeHtml(l.text)}</div>`)
    .join("");
}

// ---- File open / save ----
function downloadMo() {
  const name = fileNameInput.value.trim() || "main.mo";
  const blob = new Blob([codeInput.value], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.endsWith(".mo") ? name : `${name}.mo`;
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
  loadIntoEditor(STARTER_PROGRAM, "main.mo");
});

document.getElementById("runBtn").addEventListener("click", simulateRun);
document.getElementById("clearOutputBtn").addEventListener("click", () => {
  outputBody.textContent = "Output cleared.";
});
document.getElementById("downloadBtn").addEventListener("click", downloadMo);
document.getElementById("fileUpload").addEventListener("change", handleFileUpload);

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
});

// This dropdown demonstrates that Motoko is registered as a selectable
// language option alongside the site's other editors. Wire the
// `change` handler up to the shared editor-index navigation once this
// page is integrated into pages/editors/.
languageSelect.addEventListener("change", (e) => {
  const chosen = e.target.value;
  if (chosen !== "motoko") {
    console.info(`Navigate to the ${chosen} editor (hook up to real routing on integration).`);
  }
});

// ---- Init ----
buildPanels();
loadIntoEditor(STARTER_PROGRAM, "main.mo");
