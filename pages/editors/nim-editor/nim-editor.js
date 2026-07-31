document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try {
    initNmEditor();
  } catch (e) {
    console.error('NmEditor:', e);
  }
});

function initLoadingScreen() {
  setTimeout(() => {
    const s = document.getElementById('loading-screen');
    if (s) s.classList.add('hidden');
  }, 1500);
}

function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initNavbar() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (!menuToggle || !navLinks) return;
  let overlay = document.querySelector('.nav-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);
  }
  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navLinks.classList.contains('active');
    navLinks.classList.toggle('active', isOpen);
    menuToggle.setAttribute('aria-expanded', isOpen);
    overlay.classList.toggle('active', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    const icon = menuToggle.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-bars', !isOpen);
      icon.classList.toggle('fa-times', isOpen);
    }
  };
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });
  overlay.addEventListener('click', () => toggleMenu(false));
  navLinks
    .querySelectorAll('a')
    .forEach((a) => a.addEventListener('click', () => toggleMenu(false)));
  const isMobile = () => window.matchMedia('(max-width: 1024px)').matches;
  document.querySelectorAll('.dropdown-toggle').forEach((toggle) => {
    const parent = toggle.closest('.has-dropdown');
    const menu = parent?.querySelector('.dropdown-menu');
    if (!parent || !menu) return;
    let t;
    parent.addEventListener('mouseenter', () => {
      if (!isMobile()) {
        clearTimeout(t);
        parent.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
    parent.addEventListener('mouseleave', () => {
      if (!isMobile()) {
        t = setTimeout(() => {
          parent.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }, 250);
      }
    });
    toggle.addEventListener('click', (e) => {
      if (isMobile()) {
        e.preventDefault();
        e.stopPropagation();
        const o = parent.classList.toggle('open');
        toggle.setAttribute('aria-expanded', o);
      }
    });
  });
  window.addEventListener('scroll', () => {
    const nav = document.querySelector('.navbar');
    if (nav)
      nav.style.background = window.scrollY > 100 ? 'rgba(10,10,26,0.95)' : 'rgba(10,10,26,0.85)';
  });
}

/* ─── Nim Examples ─── */
const NIM_EXAMPLES = {
  hello: [
    {
      name: 'main.nim',
      content: `echo "Hello, World!"
echo "Welcome to the Nim Language Editor!"
`,
    },
  ],

  variables: [
    {
      name: 'main.nim',
      content: `import std/strformat

# \`let\` creates immutable variables (value can't change after initialization)
let language = "Nim"
let year = 2008

# \`var\` creates mutable variables
var users = 100
users += 50

# \`const\` is computed at compile-time
const pi = 3.14159

echo fmt"Language: {language}"
echo fmt"Year Created: {year}"
echo fmt"Current Users: {users}"
echo fmt"PI: {pi}"
`,
    },
  ],

  loops: [
    {
      name: 'main.nim',
      content: `import std/strutils

# For loop with a range
echo "Counting up:"
for i in 1..5:
  echo "  ", i

# While loop
echo "\\nCounting down:"
var count = 3
while count > 0:
  echo "  ", count
  dec count

# Iterating over sequences (arrays)
let fruits = @["Apple", "Banana", "Cherry"]
echo "\\nFruits:"
for idx, fruit in fruits:
  echo "  ", idx + 1, ": ", fruit.toUpperAscii()
`,
    },
  ],

  procedures: [
    {
      name: 'main.nim',
      content: `import std/strformat

# Basic procedure
proc greet(name: string): string =
  return "Hello, " & name & "!"

# Procedure with default arguments and implicit return
proc power(base: int, exp: int = 2): int =
  var resultValue = 1
  for _ in 1..exp:
    resultValue *= base
  resultValue # Implicit return of the last expression

# Generic procedure
proc max[T](a, b: T): T =
  if a > b: a else: b

echo greet("Algo Verse")
echo fmt"3 squared is {power(3)}"
echo fmt"2 to the 4th is {power(2, 4)}"

echo fmt"Max of 10 and 20: {max(10, 20)}"
echo fmt"Max of 3.5 and 1.2: {max(3.5, 1.2)}"
`,
    },
  ],

  objects: [
    {
      name: 'main.nim',
      content: `import std/strformat

# Define an object type
type
  Person = object
    name: string
    age: int
    isDeveloper: bool

# Method syntax (syntactic sugar for procedure with object as first param)
proc introduce(p: Person) =
  let role = if p.isDeveloper: "a developer" else: "not a developer"
  echo fmt"Hi, I'm {p.name}, I am {p.age} years old and {role}."

# Inheritance using ref object of RootObj
type
  Animal = ref object of RootObj
    name: string
    
  Dog = ref object of Animal
    breed: string

proc speak(a: Animal) =
  echo a.name, " makes a noise."

proc speak(d: Dog) =
  echo d.name, " barks! (Breed: ", d.breed, ")"

# Main execution
var alice = Person(name: "Alice", age: 30, isDeveloper: true)
alice.introduce() # Equivalent to introduce(alice)

let rex = Dog(name: "Rex", breed: "German Shepherd")
rex.speak()
`,
    },
  ],
};

/* ─── Piston API Executor ─── */
async function executeNmCode(files) {
  if (files.length === 0 || !files.some((f) => f.content.trim())) {
    return { output: [], errors: ['No code to execute.'] };
  }

  const pistonFiles = files.map((f) => ({
    name: f.name,
    content: f.content,
  }));

  try {
    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'nim',
        version: '*',
        files: pistonFiles,
        stdin: '',
        args: [],
        compile_timeout: 15000,
        run_timeout: 4000,
        compile_memory_limit: -1,
        run_memory_limit: -1,
      }),
    });

    if (!response.ok) {
      throw new Error('Piston API request failed: ' + response.statusText);
    }

    const data = await response.json();
    const output = [];
    const errors = [];

    if (data.compile && data.compile.stderr) {
      errors.push(...data.compile.stderr.split('\n').filter((l) => l.trim()));
    }

    if (data.run && data.run.stderr) {
      errors.push(...data.run.stderr.split('\n').filter((l) => l.trim()));
    }

    if (data.run && data.run.stdout) {
      output.push(...data.run.stdout.split('\n'));
    }

    if (output.length === 0 && errors.length === 0) {
      output.push('Process finished with no output.');
    }

    return { output, errors };
  } catch (error) {
    return { output: [], errors: ['Execution Error: ' + error.message] };
  }
}

/* ─── Syntax Highlighting for Nim ─── */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightNm(code) {
  const lines = code.split('\n');
  const highlighted = lines
    .map((line) => {
      let result = escapeHtml(line);

      // Nim language keywords, types, and built-in tokens
      const regex =
        /(<[^>]+>)|(#.*$)|(`[^`]*`|"[^"]*"|'[^']*')|(\b(addr|and|as|asm|bind|block|break|case|cast|concept|const|continue|converter|defer|discard|distinct|div|do|elif|else|end|enum|except|export|finally|for|from|func|if|import|in|include|interface|is|isnot|iterator|let|macro|method|mixin|mod|nil|not|notin|object|of|or|out|proc|ptr|raise|ref|return|shl|shr|static|template|try|tuple|type|using|var|when|while|xor|yield|int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|float|float32|float64|bool|char|string|cstring|seq|array|set|echo|true|false)\b)|(\b\w+(?=\s*[(!]))|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\b(?!\.[a-zA-Z]))/g;

      return result.replace(regex, (m, tag, comment, str, kw, kwInner, fn, num) => {
        if (tag) return tag;
        if (comment) return '<span class="token comment">' + comment + '</span>';
        if (str) return '<span class="token string">' + str + '</span>';
        if (kw) return '<span class="token keyword">' + kw + '</span>';
        if (fn) return '<span class="token function">' + fn + '</span>';
        if (num) return '<span class="token number">' + num + '</span>';
        return m;
      });
    })
    .join('\n');

  return highlighted;
}

/* ─── Init Editor ─── */
function initNmEditor() {
  const editor = document.getElementById('nmEditor');
  const highlight = document.getElementById('nmHighlight');
  if (!editor || !highlight) return;

  const outputBody = document.getElementById('nmOutputBody');
  const consoleBody = document.getElementById('nmConsoleBody');
  const runBtn = document.getElementById('nmRunBtn');
  const resetBtn = document.getElementById('nmResetBtn');
  const copyBtn = document.getElementById('nmCopyBtn');
  const saveBtn = document.getElementById('nmSaveBtn');
  const exampleSelect = document.getElementById('nmExampleSelect');
  const lineNumbers = document.getElementById('nmLineNumbers');
  const statusBadge = document.getElementById('nmStatusBadge');
  const consoleClear = document.getElementById('nmConsoleClear');
  const fileList = document.getElementById('nmFileList');
  const newFileBtn = document.getElementById('nmNewFileBtn');
  const activeFileNameEl = document.getElementById('nmActiveFileName');

  const SAVE_KEY = 'nim-editor-project';
  let runSeq = 0;

  // Project state
  let files = [];
  let activeIndex = 0;

  // Load project from localStorage or default
  const savedProject = localStorage.getItem(SAVE_KEY);
  if (savedProject) {
    try {
      const parsed = JSON.parse(savedProject);
      files = parsed.files || NIM_EXAMPLES.hello;
      activeIndex = parsed.activeIndex !== undefined ? parsed.activeIndex : 0;
      if (activeIndex >= files.length) activeIndex = 0;
    } catch (e) {
      files = JSON.parse(JSON.stringify(NIM_EXAMPLES.hello));
      activeIndex = 0;
    }
  } else {
    files = JSON.parse(JSON.stringify(NIM_EXAMPLES.hello));
    activeIndex = 0;
  }

  // Initial Sync
  syncEditorState();
  renderFileList();

  // Scroll Sync
  editor.addEventListener('scroll', () => {
    lineNumbers.scrollTop = editor.scrollTop;
    highlight.scrollTop = editor.scrollTop;
    highlight.scrollLeft = editor.scrollLeft;
  });

  // Input & Hotkeys
  editor.addEventListener('input', () => {
    files[activeIndex].content = editor.value;
    updateSyntaxHighlight();
    updateLineNumbers();
  });

  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = editor.selectionStart;
      editor.value =
        editor.value.substring(0, s) + '  ' + editor.value.substring(editor.selectionEnd); // Nim uses 2 spaces often
      editor.selectionStart = editor.selectionEnd = s + 2;
      files[activeIndex].content = editor.value;
      updateSyntaxHighlight();
      updateLineNumbers();
    }
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      runCode();
    }
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveProject();
    }
  });

  // Actions
  runBtn.addEventListener('click', runCode);
  resetBtn.addEventListener('click', resetProject);
  copyBtn.addEventListener('click', copyCurrentFileCode);
  saveBtn.addEventListener('click', saveProject);
  consoleClear.addEventListener('click', clearConsole);

  exampleSelect.addEventListener('change', () => {
    const val = exampleSelect.value;
    if (NIM_EXAMPLES[val]) {
      files = JSON.parse(JSON.stringify(NIM_EXAMPLES[val]));
      activeIndex = 0;
      syncEditorState();
      renderFileList();
    }
  });

  newFileBtn.addEventListener('click', showNewFileInput);

  /* ── Core Editor Functions ── */

  function syncEditorState() {
    const activeFile = files[activeIndex];
    activeFileNameEl.textContent = activeFile.name;
    editor.value = activeFile.content;
    updateSyntaxHighlight();
    updateLineNumbers();

    // Clear scroll position sync on active file switch
    editor.scrollTop = 0;
    editor.scrollLeft = 0;
    lineNumbers.scrollTop = 0;
    highlight.scrollTop = 0;
    highlight.scrollLeft = 0;
  }

  function updateSyntaxHighlight() {
    highlight.innerHTML = highlightNm(editor.value) + '\n';
  }

  function updateLineNumbers() {
    const count = editor.value.split('\n').length;
    lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join(
      '\n'
    );
  }

  function renderFileList() {
    fileList.innerHTML = '';
    files.forEach((file, index) => {
      const el = document.createElement('div');
      el.className = `file-item ${index === activeIndex ? 'active' : ''}`;
      el.dataset.index = index;

      const nameContainer = document.createElement('div');
      nameContainer.className = 'file-name-container';
      nameContainer.innerHTML = `<i class="far fa-file-code"></i> <span>${escapeHtml(file.name)}</span>`;
      el.appendChild(nameContainer);

      const actionContainer = document.createElement('div');
      actionContainer.className = 'file-item-actions';

      // Edit Button
      const editBtn = document.createElement('button');
      editBtn.className = 'file-action-btn edit';
      editBtn.title = 'Rename File';
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showRenameInput(index);
      });
      actionContainer.appendChild(editBtn);

      // Delete Button
      const delBtn = document.createElement('button');
      delBtn.className = 'file-action-btn delete';
      delBtn.title = 'Delete File';
      delBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteFile(index);
      });
      actionContainer.appendChild(delBtn);

      el.appendChild(actionContainer);

      el.addEventListener('click', () => {
        activeIndex = index;
        syncEditorState();
        renderFileList();
      });

      fileList.appendChild(el);
    });
  }

  function showNewFileInput() {
    // Check if new file input is already showing
    if (document.getElementById('newFileInput')) {
      document.getElementById('newFileInput').focus();
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'file-item-input-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'file-item-input';
    input.id = 'newFileInput';
    input.placeholder = 'filename.nim';

    wrapper.appendChild(input);
    fileList.appendChild(wrapper);
    input.focus();

    const finishNewFile = () => {
      const name = input.value.trim();
      if (!name) {
        wrapper.remove();
        return;
      }

      // Validations
      if (!name.endsWith('.nim')) {
        void 0;
        input.focus();
        return;
      }

      if (files.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
        void 0;
        input.focus();
        return;
      }

      const newFile = {
        name: name,
        content: `# Nim Language File: ${name}\n\necho "Hello from ${name}"\n`,
      };

      files.push(newFile);
      activeIndex = files.length - 1;
      wrapper.remove();
      saveProject();
      syncEditorState();
      renderFileList();
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishNewFile();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        wrapper.remove();
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (wrapper.parentNode) {
          finishNewFile();
        }
      }, 200);
    });
  }

  function showRenameInput(index) {
    const file = files[index];
    const itemEl = fileList.children[index];
    if (!itemEl) return;

    itemEl.innerHTML = '';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'file-item-input';
    input.value = file.name;
    itemEl.appendChild(input);
    input.focus();
    input.select();

    const finishRename = () => {
      const newName = input.value.trim();
      if (!newName || newName === file.name) {
        renderFileList();
        return;
      }

      if (!newName.endsWith('.nim')) {
        void 0;
        input.focus();
        return;
      }

      if (files.some((f, idx) => idx !== index && f.name.toLowerCase() === newName.toLowerCase())) {
        void 0;
        input.focus();
        return;
      }

      file.name = newName;
      saveProject();
      renderFileList();
      if (index === activeIndex) {
        activeFileNameEl.textContent = newName;
      }
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishRename();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        renderFileList();
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (input.parentNode) {
          finishRename();
        }
      }, 200);
    });
  }

  function deleteFile(index) {
    if (files.length <= 1) {
      return;
    }

    files.splice(index, 1);
    if (activeIndex >= files.length) {
      activeIndex = files.length - 1;
    }
    saveProject();
    syncEditorState();
    renderFileList();
  }

  function saveProject() {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        files,
        activeIndex,
      })
    );
    showActionIndicator(saveBtn, '<i class="fas fa-check"></i>');
  }

  function resetProject() {
    const val = exampleSelect.value;
    files = JSON.parse(JSON.stringify(NIM_EXAMPLES[val] || NIM_EXAMPLES.hello));
    activeIndex = 0;
    saveProject();
    syncEditorState();
    renderFileList();
    showActionIndicator(resetBtn, '<i class="fas fa-check"></i>');
  }

  function copyCurrentFileCode() {
    navigator.clipboard
      .writeText(editor.value)
      .then(() => {
        showActionIndicator(copyBtn, '<i class="fas fa-check"></i>');
      })
      .catch(() => {
        logError('Failed to copy code to clipboard.');
      });
  }

  function showActionIndicator(btn, successHTML) {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = successHTML;
    btn.style.color = '#22c55e';
    btn.style.borderColor = '#22c55e';
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2000);
  }

  function clearConsole() {
    consoleBody.innerHTML = '<span class="nm-console-placeholder">No errors detected.</span>';
  }

  async function runCode() {
    const seq = ++runSeq;
    setStatus('running');
    outputBody.innerHTML = '<span class="nm-output-placeholder">Compiling and running...</span>';
    consoleBody.innerHTML = '<span class="nm-console-placeholder">No errors detected.</span>';

    const { output, errors } = await executeNmCode(files);
    if (seq !== runSeq) return; // Prevent race conditions

    if (output.length > 0) {
      outputBody.innerHTML = '';
      output.forEach((line) => {
        const el = document.createElement('span');
        el.className = 'nm-output-line';
        el.textContent = line;
        outputBody.appendChild(el);
      });
    } else {
      outputBody.innerHTML =
        '<span class="nm-output-placeholder">No standard output produced.</span>';
    }

    if (errors.length > 0) {
      consoleBody.innerHTML = '';
      errors.forEach(logError);
      setStatus('error');
    } else {
      setStatus('ready');
    }
  }

  function logError(msg) {
    const placeholder = consoleBody.querySelector('.nm-console-placeholder');
    if (placeholder) placeholder.remove();
    const el = document.createElement('span');
    el.className = 'nm-console-line';
    el.textContent = msg;
    consoleBody.appendChild(el);
  }

  function setStatus(state) {
    const map = {
      ready: ['Ready', 'nm-status-ready'],
      running: ['Running', 'nm-status-running'],
      error: ['Error', 'nm-status-error'],
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `nm-status-badge ${cls}`;
  }
}
