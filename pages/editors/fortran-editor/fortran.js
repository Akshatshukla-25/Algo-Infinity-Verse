// Fortran Editor — pages/editors/fortran
// Client-side only: manual tokenizer for syntax highlighting (no external lib),
// example insertion, .f90 open/save, and a simulated run (no real compiler).

const STARTER_PROGRAM = `program hello_world
    implicit none

    print *, "Hello, Fortran!"

end program hello_world
`;

const KEYWORDS = [
  "PROGRAM","END","IMPLICIT","NONE","SUBROUTINE","FUNCTION","MODULE",
  "CONTAINS","USE","CALL","RETURN","IF","THEN","ELSE","ELSEIF","ENDIF",
  "DO","ENDDO","WHILE","EXIT","CYCLE","SELECT","CASE","DEFAULT","ENDSELECT",
  "READ","WRITE","PRINT","FORMAT","ALLOCATE","DEALLOCATE","DIMENSION",
  "PARAMETER","INTENT","IN","OUT","INOUT","STOP","CONTINUE","GOTO",
  "INTERFACE","PUBLIC","PRIVATE","RESULT","RECURSIVE","OPTIONAL","POINTER",
  "TARGET","ALLOCATABLE","SAVE","EXTERNAL","COMMON","EQUIVALENCE"
];

const TYPES = [
  "INTEGER","REAL","DOUBLE","PRECISION","CHARACTER","LOGICAL","COMPLEX","TYPE"
];

const INTRINSICS = [
  "SQRT","ABS","SIN","COS","TAN","EXP","LOG","LOG10","MOD","MAX","MIN",
  "SUM","PRODUCT","SIZE","REAL","INT","NINT","FLOOR","CEILING","TRIM",
  "LEN","MATMUL","TRANSPOSE","DOT_PRODUCT","PRESENT","MAXVAL","MINVAL"
];

const EXAMPLES = [
  {
    title: "Quadratic solver",
    desc: "Roots of ax\u00B2 + bx + c",
    code: `program quadratic_solver
    implicit none
    real :: a, b, c, discriminant, root1, root2

    a = 1.0
    b = -3.0
    c = 2.0

    discriminant = b**2 - 4.0*a*c

    if (discriminant > 0.0) then
        root1 = (-b + sqrt(discriminant)) / (2.0*a)
        root2 = (-b - sqrt(discriminant)) / (2.0*a)
        print *, "Roots:", root1, root2
    else if (discriminant == 0.0) then
        root1 = -b / (2.0*a)
        print *, "Repeated root:", root1
    else
        print *, "Complex roots, discriminant =", discriminant
    end if

end program quadratic_solver
`
  },
  {
    title: "Matrix multiplication",
    desc: "2x2 matrix product with MATMUL",
    code: `program matrix_multiply
    implicit none
    real, dimension(2,2) :: a, b, c

    a = reshape([1.0, 2.0, 3.0, 4.0], [2,2])
    b = reshape([5.0, 6.0, 7.0, 8.0], [2,2])

    c = matmul(a, b)

    print *, "Result matrix:"
    print *, c(1,1), c(1,2)
    print *, c(2,1), c(2,2)

end program matrix_multiply
`
  },
  {
    title: "Trapezoidal integration",
    desc: "Numerical integral of f(x) = x^2",
    code: `program trapezoidal_rule
    implicit none
    integer, parameter :: n = 1000
    real :: a, b, h, x, total
    integer :: i

    a = 0.0
    b = 2.0
    h = (b - a) / real(n)
    total = 0.0

    do i = 1, n - 1
        x = a + real(i) * h
        total = total + x**2
    end do

    total = h * (total + 0.5*(a**2 + b**2))
    print *, "Approximate integral:", total

end program trapezoidal_rule
`
  },
  {
    title: "Fibonacci sequence",
    desc: "Iterative sequence via DO loop",
    code: `program fibonacci
    implicit none
    integer :: n, i, temp
    integer :: prev, curr

    n = 10
    prev = 0
    curr = 1

    print *, prev
    print *, curr

    do i = 3, n
        temp = curr
        curr = prev + curr
        prev = temp
        print *, curr
    end do

end program fibonacci
`
  }
];

const SNIPPETS = [
  {
    title: "DO loop",
    desc: "Counted loop",
    code: `    do i = 1, 10
        print *, i
    end do`
  },
  {
    title: "IF / ELSE",
    desc: "Conditional branch",
    code: `    if (x > 0.0) then
        print *, "Positive"
    else
        print *, "Not positive"
    end if`
  },
  {
    title: "Variable declaration",
    desc: "Typed declaration",
    code: `    real :: x, y, result`
  },
  {
    title: "SUBROUTINE",
    desc: "Reusable procedure",
    code: `subroutine greet(name)
    implicit none
    character(len=*), intent(in) :: name
    print *, "Hello, ", name
end subroutine greet`
  },
  {
    title: "FUNCTION",
    desc: "Value-returning procedure",
    code: `function square(x) result(y)
    implicit none
    real, intent(in) :: x
    real :: y
    y = x * x
end function square`
  },
  {
    title: "Array declaration",
    desc: "Fixed-size array",
    code: `    real, dimension(10) :: values`
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

// Tokenize a single line of Fortran (free-form) for highlighting.
function highlightLine(line) {
  const trimmedStart = line.match(/^(\s*)(.*)$/);
  const leading = trimmedStart[1];
  const rest = trimmedStart[2];

  if (rest.startsWith("!")) {
    return escapeHtml(leading) + `<span class="tok-comment">${escapeHtml(rest)}</span>`;
  }

  // Split off trailing inline comment (unquoted '!')
  let code = rest;
  let comment = "";
  let inSingle = false, inDouble = false;
  for (let i = 0; i < rest.length; i++) {
    const ch = rest[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === "!" && !inSingle && !inDouble) {
      code = rest.slice(0, i);
      comment = rest.slice(i);
      break;
    }
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
    const tokenRe = /([A-Za-z][A-Za-z0-9_]*)|(\d+(\.\d+)?([eE][+-]?\d+)?)|(\s+)|([^\sA-Za-z0-9]+)/g;
    let m;
    while ((m = tokenRe.exec(part.text)) !== null) {
      const word = m[0];
      if (m[1]) {
        const upper = word.toUpperCase();
        if (TYPES.includes(upper)) {
          html += `<span class="tok-type">${escapeHtml(word)}</span>`;
        } else if (KEYWORDS.includes(upper)) {
          html += `<span class="tok-kw">${escapeHtml(word)}</span>`;
        } else if (INTRINSICS.includes(upper)) {
          html += `<span class="tok-intrinsic">${escapeHtml(word)}</span>`;
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
      const slug = ex.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      loadIntoEditor(ex.code, `${slug}.f90`);
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
// There is no real Fortran compiler in the browser. We do a light static
// scan for the required program/end-program pair and simulate the
// expected console output for `print *, ...` statements.
function simulateRun() {
  const code = codeInput.value;
  const lines = [];

  const hasProgram = /\bprogram\s+\w+/i.test(code);
  const hasEndProgram = /\bend\s+program\b/i.test(code);
  const hasImplicitNone = /\bimplicit\s+none\b/i.test(code);

  if (!hasProgram) {
    lines.push({ text: "error: missing PROGRAM statement.", err: true });
  }
  if (!hasEndProgram) {
    lines.push({ text: "error: missing END PROGRAM statement.", err: true });
  }
  if (!hasImplicitNone) {
    lines.push({ text: "warning: IMPLICIT NONE not found — implicit typing is discouraged.", err: true });
  }

  if (hasProgram && hasEndProgram) {
    lines.push({ text: "compiling... ok", err: false });

    const printRe = /print\s*\*\s*,\s*(.+)/gi;
    let match;
    let found = false;
    while ((match = printRe.exec(code)) !== null) {
      found = true;
      const argsPart = match[1].trim();
      const tokens = argsPart.match(/"[^"]*"|'[^']*'|[^,]+/g) || [];
      const rendered = tokens
        .map((tok) => {
          const t = tok.trim();
          if (/^["'].*["']$/.test(t)) return t.slice(1, -1);
          return `<${t}>`; // unresolved expression/variable in this simulation
        })
        .join(" ");
      lines.push({ text: rendered, err: false });
    }
    if (!found) {
      lines.push({ text: "(no print statements found — nothing printed)", err: false });
    }
    lines.push({ text: "program exited normally", err: false });
  }

  outputBody.innerHTML = lines
    .map((l) => `<div class="${l.err ? "err-line" : "ok-line"}">${escapeHtml(l.text)}</div>`)
    .join("");
}

// ---- File open / save ----
function downloadF90() {
  const name = fileNameInput.value.trim() || "program.f90";
  const blob = new Blob([codeInput.value], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = /\.(f90|f95|for)$/i.test(name) ? name : `${name}.f90`;
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
  if (e.key === "Tab" && !e.shiftKey) {
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
  codeInput.value = value.slice(0, start) + "    " + value.slice(end);
  codeInput.selectionStart = codeInput.selectionEnd = start + 4;
  renderHighlight();
}

document.getElementById("loadStarterBtn").addEventListener("click", () => {
  loadIntoEditor(STARTER_PROGRAM, "hello-world.f90");
});

document.getElementById("runBtn").addEventListener("click", simulateRun);
document.getElementById("clearOutputBtn").addEventListener("click", () => {
  outputBody.textContent = "Output cleared.";
});
document.getElementById("downloadBtn").addEventListener("click", downloadF90);
document.getElementById("fileUpload").addEventListener("change", handleFileUpload);

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
});

// ---- Init ----
buildPanels();
loadIntoEditor(STARTER_PROGRAM, "hello-world.f90");
