// x86 Assembly Editor — pages/editors/assembly
// Client-side only: manual tokenizer for syntax highlighting (no external lib),
// example insertion, .asm open/save, and a simulated run (no real assembler).
// Syntax target: NASM, x86-64, Linux syscalls.

const STARTER_PROGRAM = `section .data
    msg     db  "Hello, Assembly!", 10
    msg_len equ $ - msg

section .text
    global _start

_start:
    mov     rax, 1          ; syscall: write
    mov     rdi, 1          ; fd: stdout
    mov     rsi, msg        ; pointer to message
    mov     rdx, msg_len    ; message length
    syscall

    mov     rax, 60         ; syscall: exit
    xor     rdi, rdi        ; status: 0
    syscall
`;

const INSTRUCTIONS = [
  "MOV","ADD","SUB","CMP","JMP","JE","JNE","JZ","JNZ","JG","JGE","JL","JLE",
  "JA","JAE","JB","JBE","CALL","RET","PUSH","POP","SYSCALL","INT","LOOP",
  "INC","DEC","MUL","IMUL","DIV","IDIV","AND","OR","XOR","NOT","NEG",
  "SHL","SHR","SAR","SAL","LEA","NOP","TEST","MOVZX","MOVSX","LEAVE",
  "ENTER","REP","REPE","REPNE","STOSB","MOVSB","CDQ","CQO","SETE","SETNE"
];

const REGISTERS = [
  "RAX","RBX","RCX","RDX","RSI","RDI","RBP","RSP",
  "EAX","EBX","ECX","EDX","ESI","EDI","EBP","ESP",
  "AX","BX","CX","DX","SI","DI","BP","SP",
  "AL","BL","CL","DL","AH","BH","CH","DH",
  "R8","R9","R10","R11","R12","R13","R14","R15",
  "R8D","R9D","R10D","R11D","R12D","R13D","R14D","R15D"
];

const DIRECTIVES = [
  "SECTION","GLOBAL","EXTERN","DB","DW","DD","DQ","RESB","RESW","RESD","RESQ",
  "EQU","TIMES","BITS","ORG","DEFAULT","STRUC","ENDSTRUC","%DEFINE","%MACRO","%ENDMACRO"
];

const REGISTER_REFERENCE = [
  { name: "RAX", desc: "Accumulator / return value" },
  { name: "RDI", desc: "1st syscall / function arg" },
  { name: "RSI", desc: "2nd syscall / function arg" },
  { name: "RDX", desc: "3rd syscall / function arg" },
  { name: "RSP", desc: "Stack pointer" },
  { name: "RBP", desc: "Base / frame pointer" },
  { name: "RIP", desc: "Instruction pointer" },
  { name: "RFLAGS", desc: "Status flags (ZF, CF...)" }
];

const EXAMPLES = [
  {
    title: "Hello, World",
    desc: "Write syscall + exit",
    code: STARTER_PROGRAM
  },
  {
    title: "Sum of an array",
    desc: "Loop accumulating values",
    code: `section .data
    numbers dq  10, 20, 30, 40, 50
    count   equ 5

section .bss
    total   resq 1

section .text
    global _start

_start:
    xor     rax, rax        ; accumulator = 0
    xor     rcx, rcx        ; index = 0

sum_loop:
    cmp     rcx, count
    jge     sum_done
    add     rax, [numbers + rcx*8]
    inc     rcx
    jmp     sum_loop

sum_done:
    mov     [total], rax

    mov     rax, 60         ; syscall: exit
    xor     rdi, rdi
    syscall
`
  },
  {
    title: "Factorial (iterative)",
    desc: "Register-only loop, no stack frame",
    code: `section .text
    global _start

_start:
    mov     rcx, 5          ; n = 5
    mov     rax, 1          ; result = 1

factorial_loop:
    cmp     rcx, 1
    jle     factorial_done
    imul    rax, rcx
    dec     rcx
    jmp     factorial_loop

factorial_done:
    ; result is now in rax
    mov     rax, 60         ; syscall: exit
    mov     rdi, 0
    syscall
`
  },
  {
    title: "Fibonacci sequence",
    desc: "Iterative sequence in registers",
    code: `section .text
    global _start

_start:
    xor     rax, rax        ; fib(0)
    mov     rbx, 1          ; fib(1)
    mov     rcx, 10         ; iterations

fib_loop:
    cmp     rcx, 0
    je      fib_done
    push    rax
    add     rax, rbx
    pop     rbx
    xchg    rax, rbx
    dec     rcx
    jmp     fib_loop

fib_done:
    mov     rax, 60
    xor     rdi, rdi
    syscall
`
  }
];

const SNIPPETS = [
  {
    title: "MOV",
    desc: "Move a value into a register",
    code: `    mov     rax, 1`
  },
  {
    title: "CMP / JMP",
    desc: "Conditional branch",
    code: `    cmp     rax, rbx
    jg      label_greater`
  },
  {
    title: "Loop skeleton",
    desc: "Counted loop with a label",
    code: `loop_start:
    cmp     rcx, 0
    je      loop_end
    dec     rcx
    jmp     loop_start
loop_end:`
  },
  {
    title: "PUSH / CALL / RET",
    desc: "Function call convention",
    code: `    push    rdi
    call    my_function
    pop     rdi

my_function:
    ret`
  },
  {
    title: "Data section string",
    desc: "Declare a null/length-prefixed string",
    code: `section .data
    greeting db "Hi there", 10
    greeting_len equ $ - greeting`
  },
  {
    title: "Exit syscall",
    desc: "Terminate the program",
    code: `    mov     rax, 60
    xor     rdi, rdi
    syscall`
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

// Tokenize a single line of NASM-style x86 assembly for highlighting.
function highlightLine(line) {
  const trimmedStart = line.match(/^(\s*)(.*)$/);
  const leading = trimmedStart[1];
  const rest = trimmedStart[2];

  if (rest.startsWith(";")) {
    return escapeHtml(leading) + `<span class="tok-comment">${escapeHtml(rest)}</span>`;
  }

  // Split off trailing inline comment (unquoted ';')
  let code = rest;
  let comment = "";
  let inString = false;
  let quoteChar = "";
  for (let i = 0; i < rest.length; i++) {
    const ch = rest[i];
    if ((ch === '"' || ch === "'") && !inString) { inString = true; quoteChar = ch; }
    else if (ch === quoteChar && inString) { inString = false; }
    else if (ch === ";" && !inString) {
      code = rest.slice(0, i);
      comment = rest.slice(i);
      break;
    }
  }

  // Label line (identifier immediately followed by ':')
  const labelMatch = code.match(/^([A-Za-z_.][A-Za-z0-9_.]*)\s*:/);
  let labelHtml = "";
  if (labelMatch) {
    labelHtml = `<span class="tok-label">${escapeHtml(labelMatch[1])}</span>:`;
    code = code.slice(labelMatch[0].length);
  }

  let html = "";
  const stringRe = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g;
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
    const tokenRe = /(%?[A-Za-z_.][A-Za-z0-9_.]*)|(0x[0-9a-fA-F]+|\d+)|(\s+)|([^\sA-Za-z0-9]+)/g;
    let m;
    while ((m = tokenRe.exec(part.text)) !== null) {
      const word = m[0];
      if (m[1]) {
        const upper = word.toUpperCase();
        if (DIRECTIVES.includes(upper)) {
          html += `<span class="tok-directive">${escapeHtml(word)}</span>`;
        } else if (INSTRUCTIONS.includes(upper)) {
          html += `<span class="tok-instr">${escapeHtml(word)}</span>`;
        } else if (REGISTERS.includes(upper)) {
          html += `<span class="tok-register">${escapeHtml(word)}</span>`;
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

  return escapeHtml(leading) + labelHtml + html;
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
      const slug = ex.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      loadIntoEditor(ex.code, `${slug}.asm`);
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

  const registerGrid = document.getElementById("registerGrid");
  registerGrid.innerHTML = "";
  REGISTER_REFERENCE.forEach((reg) => {
    const cell = document.createElement("div");
    cell.className = "register-cell";
    cell.innerHTML = `<span class="reg-name">${reg.name}</span><span class="reg-desc">${reg.desc}</span>`;
    registerGrid.appendChild(cell);
  });
}

// ---- Simulated run ----
// There is no real assembler/CPU in the browser. We do a light static
// scan for the required entry point and exit syscall, and simulate the
// output of a `write` syscall by echoing back any `db "..."` strings
// that appear before the exit sequence.
function simulateRun() {
  const code = codeInput.value;
  const lines = [];

  const hasEntry = /\bglobal\s+_start\b/i.test(code) || /\bglobal\s+main\b/i.test(code);
  const hasSyscall = /\bsyscall\b/i.test(code) || /\bint\s+0x80\b/i.test(code);
  const hasExit = /mov\s+rax,\s*60/i.test(code) || /mov\s+eax,\s*1\b/i.test(code);

  if (!hasEntry) {
    lines.push({ text: "error: missing 'global _start' (or 'global main') entry point.", err: true });
  }
  if (!hasSyscall) {
    lines.push({ text: "warning: no syscall/interrupt instruction found.", err: true });
  }
  if (!hasExit) {
    lines.push({ text: "warning: no exit syscall (rax=60) found — program may not terminate cleanly.", err: true });
  }

  if (hasEntry) {
    lines.push({ text: "assembling... ok", err: false });
    lines.push({ text: "linking... ok", err: false });

    const stringRe = /db\s+((?:"[^"]*"|'[^']*')(?:\s*,\s*(?:"[^"]*"|'[^']*'|\d+))*)/gi;
    let match;
    let found = false;
    while ((match = stringRe.exec(code)) !== null) {
      const strMatch = match[1].match(/"[^"]*"|'[^']*'/);
      if (strMatch) {
        found = true;
        lines.push({ text: strMatch[0].slice(1, -1), err: false });
      }
    }
    if (!found) {
      lines.push({ text: "(no string data found to display — register-only program)", err: false });
    }
    lines.push({ text: "process exited with code 0", err: false });
  }

  outputBody.innerHTML = lines
    .map((l) => `<div class="${l.err ? "err-line" : "ok-line"}">${escapeHtml(l.text)}</div>`)
    .join("");
}

// ---- File open / save ----
function downloadAsm() {
  const name = fileNameInput.value.trim() || "program.asm";
  const blob = new Blob([codeInput.value], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = /\.(asm|s)$/i.test(name) ? name : `${name}.asm`;
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
  codeInput.value = value.slice(0, start) + "    " + value.slice(end);
  codeInput.selectionStart = codeInput.selectionEnd = start + 4;
  renderHighlight();
}

document.getElementById("loadStarterBtn").addEventListener("click", () => {
  loadIntoEditor(STARTER_PROGRAM, "hello-world.asm");
});

document.getElementById("runBtn").addEventListener("click", simulateRun);
document.getElementById("clearOutputBtn").addEventListener("click", () => {
  outputBody.textContent = "Output cleared.";
});
document.getElementById("downloadBtn").addEventListener("click", downloadAsm);
document.getElementById("fileUpload").addEventListener("change", handleFileUpload);

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
});

// ---- Init ----
buildPanels();
loadIntoEditor(STARTER_PROGRAM, "hello-world.asm");
