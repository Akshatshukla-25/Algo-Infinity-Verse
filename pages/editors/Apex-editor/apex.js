// Apex Editor — pages/editors/apex
// Client-side only: manual tokenizer for syntax highlighting (no external lib),
// template insertion, .cls/.trigger open/save, and a simulated run (no real org).

const STARTER_PROGRAM = `public with sharing class HelloWorld {
    public static void sayHello() {
        System.debug('Hello, Apex!');
    }
}
`;

const KEYWORDS = [
  "PUBLIC","PRIVATE","PROTECTED","GLOBAL","CLASS","INTERFACE","EXTENDS",
  "IMPLEMENTS","VOID","STATIC","FINAL","VIRTUAL","OVERRIDE","ABSTRACT",
  "NEW","RETURN","IF","ELSE","FOR","WHILE","DO","SWITCH","ON","WHEN",
  "TRY","CATCH","FINALLY","THROW","THROWS","THIS","SUPER","TRIGGER",
  "BEFORE","AFTER","INSERT","UPDATE","DELETE","UNDELETE","UPSERT",
  "NULL","TRUE","FALSE","GET","SET","BREAK","CONTINUE","INSTANCEOF",
  "WITH","WITHOUT","SHARING","ENUM","TRANSIENT"
];

const TYPES = [
  "INTEGER","STRING","BOOLEAN","LIST","MAP","SET","ID","OBJECT","DECIMAL",
  "DOUBLE","LONG","BLOB","DATE","DATETIME","SOBJECT","SCHEMA","EXCEPTION"
];

const SOQL_KEYWORDS = ["SELECT","FROM","WHERE","ORDER","BY","LIMIT","GROUP","ASC","DESC"];

const CLASS_TEMPLATES = [
  {
    title: "Hello World class",
    desc: "Minimal class with a static method",
    code: STARTER_PROGRAM
  },
  {
    title: "Service class with SOQL",
    desc: "Query accounts and return a list",
    code: `public with sharing class AccountService {

    public static List<Account> getAccountsByIndustry(String industry) {
        return [
            SELECT Id, Name, Industry, AnnualRevenue
            FROM Account
            WHERE Industry = :industry
            ORDER BY Name ASC
            LIMIT 200
        ];
    }

    public static void logAccountCount(String industry) {
        List<Account> accounts = getAccountsByIndustry(industry);
        System.debug('Found ' + accounts.size() + ' accounts');
    }
}
`
  },
  {
    title: "Test class",
    desc: "@isTest coverage for a service method",
    code: `@isTest
private class AccountServiceTest {

    @TestSetup
    static void setup() {
        insert new Account(Name = 'Acme Corp', Industry = 'Technology');
    }

    @isTest
    static void testGetAccountsByIndustry() {
        Test.startTest();
        List<Account> results = AccountService.getAccountsByIndustry('Technology');
        Test.stopTest();

        System.assertEquals(1, results.size());
        System.assertEquals('Acme Corp', results[0].Name);
    }
}
`
  }
];

const TRIGGER_TEMPLATES = [
  {
    title: "Before insert trigger",
    desc: "Delegate to a handler class",
    code: `trigger AccountTrigger on Account (before insert, before update) {

    if (Trigger.isBefore && Trigger.isInsert) {
        AccountTriggerHandler.handleBeforeInsert(Trigger.new);
    }

    if (Trigger.isBefore && Trigger.isUpdate) {
        AccountTriggerHandler.handleBeforeUpdate(Trigger.new, Trigger.oldMap);
    }
}
`
  },
  {
    title: "After insert trigger",
    desc: "Post-commit processing (e.g. related record creation)",
    code: `trigger OpportunityTrigger on Opportunity (after insert, after update) {

    if (Trigger.isAfter && Trigger.isInsert) {
        for (Opportunity opp : Trigger.new) {
            System.debug('New opportunity created: ' + opp.Name);
        }
    }
}
`
  },
  {
    title: "Trigger handler class",
    desc: "Companion class referenced by the triggers above",
    code: `public with sharing class AccountTriggerHandler {

    public static void handleBeforeInsert(List<Account> newAccounts) {
        for (Account acc : newAccounts) {
            if (acc.Industry == null) {
                acc.Industry = 'Unknown';
            }
        }
    }

    public static void handleBeforeUpdate(List<Account> newAccounts, Map<Id, Account> oldMap) {
        for (Account acc : newAccounts) {
            Account oldAcc = oldMap.get(acc.Id);
            if (acc.AnnualRevenue != oldAcc.AnnualRevenue) {
                System.debug('Revenue changed for ' + acc.Name);
            }
        }
    }
}
`
  }
];

const SNIPPETS = [
  {
    title: "SOQL query",
    desc: "Bind-variable filtered query",
    code: `        List<Account> accts = [
            SELECT Id, Name FROM Account WHERE Industry = :industry
        ];`
  },
  {
    title: "IF / ELSE",
    desc: "Conditional branch",
    code: `        if (value > 0) {
            System.debug('Positive');
        } else {
            System.debug('Not positive');
        }`
  },
  {
    title: "FOR loop over a list",
    desc: "Iterate a collection",
    code: `        for (Account acc : accounts) {
            System.debug(acc.Name);
        }`
  },
  {
    title: "TRY / CATCH",
    desc: "Exception handling",
    code: `        try {
            insert newRecord;
        } catch (DmlException e) {
            System.debug('Insert failed: ' + e.getMessage());
        }`
  },
  {
    title: "@isTest method",
    desc: "Unit test skeleton",
    code: `    @isTest
    static void testSomething() {
        Test.startTest();
        // call the method under test
        Test.stopTest();
        System.assertEquals(true, true);
    }`
  },
  {
    title: "System.debug",
    desc: "Write to the debug log",
    code: `        System.debug('Value: ' + someVariable);`
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

// Tokenize a single line of Apex for highlighting.
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
    if (ch === "'" && !inString) inString = true;
    else if (ch === "'" && inString) inString = false;
    else if (ch === "/" && rest[i + 1] === "/" && !inString) {
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
    const tokenRe = /(@[A-Za-z]+)|([A-Za-z_][A-Za-z0-9_]*)|(\d+(\.\d+)?)|(\s+)|([^\sA-Za-z0-9]+)/g;
    let m;
    while ((m = tokenRe.exec(part.text)) !== null) {
      const word = m[0];
      if (m[1]) {
        html += `<span class="tok-annotation">${escapeHtml(word)}</span>`;
      } else if (m[2]) {
        const upper = word.toUpperCase();
        if (SOQL_KEYWORDS.includes(upper)) {
          html += `<span class="tok-soql">${escapeHtml(word)}</span>`;
        } else if (TYPES.includes(upper)) {
          html += `<span class="tok-type">${escapeHtml(word)}</span>`;
        } else if (KEYWORDS.includes(upper)) {
          html += `<span class="tok-kw">${escapeHtml(word)}</span>`;
        } else {
          html += escapeHtml(word);
        }
      } else if (m[3]) {
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

function pascalCase(title) {
  return title
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
}

function buildPanels() {
  const classList = document.getElementById("classList");
  classList.innerHTML = "";
  CLASS_TEMPLATES.forEach((tpl) => {
    const btn = document.createElement("button");
    btn.className = "example-item";
    btn.innerHTML = `<span class="example-title">${tpl.title}</span><span class="example-desc">${tpl.desc}</span>`;
    btn.addEventListener("click", () => loadIntoEditor(tpl.code, `${pascalCase(tpl.title)}.cls`));
    classList.appendChild(btn);
  });

  const triggerList = document.getElementById("triggerList");
  triggerList.innerHTML = "";
  TRIGGER_TEMPLATES.forEach((tpl) => {
    const btn = document.createElement("button");
    btn.className = "example-item";
    btn.innerHTML = `<span class="example-title">${tpl.title}</span><span class="example-desc">${tpl.desc}</span>`;
    btn.addEventListener("click", () => {
      const isHandler = /handler/i.test(tpl.title);
      const ext = isHandler ? "cls" : "trigger";
      loadIntoEditor(tpl.code, `${pascalCase(tpl.title)}.${ext}`);
    });
    triggerList.appendChild(btn);
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
// There is no real Salesforce org in the browser. We do a light static
// scan for class/trigger structure and simulate the debug log output
// of literal-string System.debug(...) calls.
function simulateRun() {
  const code = codeInput.value;
  const lines = [];

  const isTrigger = /\btrigger\s+\w+\s+on\s+\w+/i.test(code);
  const isClass = /\bclass\s+\w+/i.test(code);
  const hasDebug = /System\.debug\s*\(/i.test(code);

  if (!isTrigger && !isClass) {
    lines.push({ text: "error: no class or trigger declaration found.", err: true });
  }
  if (!hasDebug) {
    lines.push({ text: "note: no System.debug() calls found — debug log will be empty.", err: true });
  }

  if (isTrigger || isClass) {
    lines.push({ text: "compiling... ok", err: false });
    lines.push({ text: isTrigger ? "trigger context simulated (Trigger.new / Trigger.isInsert)" : "class loaded", err: false });

    const debugRe = /System\.debug\s*\(\s*'([^']*)'/gi;
    let match;
    let found = false;
    while ((match = debugRe.exec(code)) !== null) {
      found = true;
      lines.push({ text: `DEBUG| ${match[1]}`, err: false });
    }
    if (!found && hasDebug) {
      lines.push({ text: "(debug calls reference variables — showing static text only)", err: false });
    }
    lines.push({ text: "execution finished, 0 errors", err: false });
  }

  outputBody.innerHTML = lines
    .map((l) => `<div class="${l.err ? "err-line" : "ok-line"}">${escapeHtml(l.text)}</div>`)
    .join("");
}

// ---- File open / save ----
function downloadFile() {
  const name = fileNameInput.value.trim() || "HelloWorld.cls";
  const blob = new Blob([codeInput.value], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = /\.(cls|trigger)$/i.test(name) ? name : `${name}.cls`;
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
  if (start === end) {
    codeInput.value = value.slice(0, start) + "    " + value.slice(end);
    codeInput.selectionStart = codeInput.selectionEnd = start + 4;
  } else {
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const before = value.slice(0, lineStart);
    const selected = value.slice(lineStart, end);
    const indented = selected.replace(/^/gm, "    ");
    codeInput.value = before + indented + value.slice(end);
    codeInput.selectionStart = lineStart;
    codeInput.selectionEnd = lineStart + indented.length;
  }
  renderHighlight();
}

document.getElementById("loadStarterBtn").addEventListener("click", () => {
  loadIntoEditor(STARTER_PROGRAM, "HelloWorld.cls");
});

document.getElementById("runBtn").addEventListener("click", simulateRun);
document.getElementById("clearOutputBtn").addEventListener("click", () => {
  outputBody.textContent = "Output cleared.";
});
document.getElementById("downloadBtn").addEventListener("click", downloadFile);
document.getElementById("fileUpload").addEventListener("change", handleFileUpload);

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
});

// This dropdown demonstrates that Apex is registered as a selectable
// language option alongside the site's other editors. Wire the
// `change` handler up to the shared editor-index navigation once this
// page is integrated into pages/editors/.
languageSelect.addEventListener("change", (e) => {
  const chosen = e.target.value;
  if (chosen !== "apex") {
    console.info(`Navigate to the ${chosen} editor (hook up to real routing on integration).`);
  }
});

// ---- Init ----
buildPanels();
loadIntoEditor(STARTER_PROGRAM, "HelloWorld.cls");
