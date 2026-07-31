document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try {
    initDEditor();
  } catch (e) {
    console.error('DEditor:', e);
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

/* ─── D Language Examples ─── */
const D_EXAMPLES = {
  hello: [
    {
      name: 'main.d',
      content: `import std.stdio;

void main() {
    writeln("Hello, World!");
    writeln("Welcome to the D Language Editor!");
}`,
    },
  ],

  variables: [
    {
      name: 'main.d',
      content: `import std.stdio;

void main() {
    // Immutable variable (compile-time constant)
    enum PI = 3.14159;

    // Runtime immutable
    immutable string name = "Algo Verse";

    // Mutable variables
    int age = 21;
    double score = 98.5;
    bool isReady = true;
    char grade = 'A';

    // Auto type inference
    auto message = "D infers types automatically!";

    writefln("Name:    %s", name);
    writefln("Age:     %d", age);
    writefln("Score:   %.1f", score);
    writefln("Ready:   %s", isReady);
    writefln("Grade:   %c", grade);
    writefln("PI:      %f", PI);
    writeln(message);
}`,
    },
  ],

  ranges: [
    {
      name: 'main.d',
      content: `import std.stdio;
import std.range;
import std.algorithm;
import std.array;
import std.conv;

void main() {
    // D's powerful range-based programming
    auto numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    writeln("Original: ", numbers);

    // Filter even numbers and square them
    auto result = numbers
        .filter!(n => n % 2 == 0)
        .map!(n => n * n)
        .array;

    writeln("Even squares: ", result);

    // Generate a range with iota
    auto range = iota(1, 6);  // 1, 2, 3, 4, 5
    writeln("\\nRange sum: ", range.sum);

    // Chain operations
    auto greeting = "hello, world!"
        .map!(c => c == ' ' ? '_' : c)
        .array
        .to!string;

    writeln("Transformed: ", greeting);

    // Zip two ranges together
    auto keys = ["name", "lang", "year"];
    auto vals = ["Algo Verse", "D", "2001"];
    foreach (pair; zip(keys, vals)) {
        writefln("  %s => %s", pair[0], pair[1]);
    }
}`,
    },
  ],

  function: [
    {
      name: 'main.d',
      content: `import std.stdio;

// Factorial using recursion
long factorial(int n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}

// Fibonacci using memoization with D's associative arrays
long[int] fibCache;
long fibonacci(int n) {
    if (n <= 1) return n;
    if (n in fibCache) return fibCache[n];
    fibCache[n] = fibonacci(n - 1) + fibonacci(n - 2);
    return fibCache[n];
}

// Template function — works with any numeric type
T max(T)(T a, T b) {
    return a > b ? a : b;
}

// Pure function (no side effects, safe to call)
pure int square(int x) {
    return x * x;
}

void main() {
    writeln("=== Factorial ===");
    foreach (i; 1 .. 8) {
        writefln("  factorial(%d) = %d", i, factorial(i));
    }

    writeln("\\n=== Fibonacci ===");
    foreach (i; 0 .. 10) {
        writefln("  fib(%d) = %d", i, fibonacci(i));
    }

    writeln("\\n=== Template max() ===");
    writefln("  max(10, 20)   = %d", max(10, 20));
    writefln("  max(3.14, 2.7) = %f", max(3.14, 2.7));

    writeln("\\n=== Pure function ===");
    writefln("  square(7) = %d", square(7));
}`,
    },
  ],

  struct: [
    {
      name: 'main.d',
      content: `import std.stdio;
import std.string;
import std.conv;

// Struct with methods
struct Point {
    double x, y;

    double distanceTo(Point other) const {
        import std.math : sqrt;
        double dx = x - other.x;
        double dy = y - other.y;
        return sqrt(dx * dx + dy * dy);
    }

    string toString() const {
        return format("(%g, %g)", x, y);
    }
}

// Class with inheritance
class Animal {
    string name;
    string sound;

    this(string name, string sound) {
        this.name = name;
        this.sound = sound;
    }

    void speak() {
        writefln("%s says %s!", name, sound);
    }
}

class Dog : Animal {
    this(string name) {
        super(name, "Woof");
    }

    void fetch(string item) {
        writefln("%s fetches the %s!", name, item);
    }
}

// Interface
interface Drawable {
    void draw();
}

struct Circle {
    Point center;
    double radius;

    void draw() {
        writefln("Drawing circle at %s with radius %g", center, radius);
    }
}

void main() {
    writeln("=== Structs ===");
    auto a = Point(0, 0);
    auto b = Point(3, 4);
    writefln("  %s -> %s = %g", a, b, a.distanceTo(b));

    writeln("\\n=== Classes & Inheritance ===");
    auto cat = new Animal("Cat", "Meow");
    auto dog = new Dog("Rex");
    cat.speak();
    dog.speak();
    dog.fetch("ball");

    writeln("\\n=== Structs with methods ===");
    auto circle = Circle(Point(5, 5), 10.0);
    circle.draw();
}`,
    },
  ],
};

/* ─── Piston API Executor ─── */
async function executeDCode(files) {
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
        language: 'd',
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

/* ─── Syntax Highlighting for D ─── */
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (m) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&`#039`;' };
    return map[m];
  });
}

function highlightD(code) {
  let result = escapeHtml(code);

  // D language keywords, types, and built-in tokens
  const regex =
    /(<[^>]+>)|(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|(`[^`]*`|"[^"]*"|'[^']*')|(\b(abstract|alias|align|asm|assert|auto|body|bool|break|byte|case|cast|catch|cdouble|cent|cfloat|char|class|const|continue|creal|dchar|debug|default|delegate|delete|deprecated|do|double|else|enum|export|extern|false|final|finally|float|for|foreach|foreach_reverse|function|goto|idouble|if|ifloat|immutable|import|in|inout|int|interface|invariant|ireal|is|lazy|long|macro|mixin|module|new|nothrow|null|out|override|package|pragma|private|protected|public|pure|real|ref|return|scope|shared|short|static|string|struct|super|switch|synchronized|template|this|throw|true|try|typeid|typeof|ubyte|ucent|uint|ulong|union|unittest|ushort|version|void|wchar|while|with|__FILE__|__LINE__|__MODULE__|__FUNCTION__)\b)|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\b(?!\.[a-zA-Z]))|(\b\w+(?=\s*[(!]))/g;

  return result.replace(regex, (m, tag, comment, blockComment, str, kw, kwInner, num, fn) => {
    if (tag) return tag;
    if (comment) return '<span class="token comment">' + comment + '</span>';
    if (blockComment) return '<span class="token comment">' + blockComment + '</span>';
    if (str) return '<span class="token string">' + str + '</span>';
    if (kw) return '<span class="token keyword">' + kw + '</span>';
    if (num) return '<span class="token number">' + num + '</span>';
    if (fn) return '<span class="token function">' + fn + '</span>';
    return m;
  });
}

/* ─── Init Editor ─── */
function initDEditor() {
  const editor = document.getElementById('dlEditor');
  const highlight = document.getElementById('dlHighlight');
  if (!editor || !highlight) return;

  const outputBody = document.getElementById('dlOutputBody');
  const consoleBody = document.getElementById('dlConsoleBody');
  const runBtn = document.getElementById('dlRunBtn');
  const resetBtn = document.getElementById('dlResetBtn');
  const copyBtn = document.getElementById('dlCopyBtn');
  const saveBtn = document.getElementById('dlSaveBtn');
  const exampleSelect = document.getElementById('dlExampleSelect');
  const lineNumbers = document.getElementById('dlLineNumbers');
  const statusBadge = document.getElementById('dlStatusBadge');
  const consoleClear = document.getElementById('dlConsoleClear');
  const fileList = document.getElementById('dlFileList');
  const newFileBtn = document.getElementById('dlNewFileBtn');
  const activeFileNameEl = document.getElementById('dlActiveFileName');

  const SAVE_KEY = 'd-editor-project';
  let runSeq = 0;

  // Project state
  let files = [];
  let activeIndex = 0;

  // Load project from localStorage or default
  const savedProject = localStorage.getItem(SAVE_KEY);
  if (savedProject) {
    try {
      const parsed = JSON.parse(savedProject);
      files = parsed.files || D_EXAMPLES.hello;
      activeIndex = parsed.activeIndex !== undefined ? parsed.activeIndex : 0;
      if (activeIndex >= files.length) activeIndex = 0;
    } catch (e) {
      files = JSON.parse(JSON.stringify(D_EXAMPLES.hello));
      activeIndex = 0;
    }
  } else {
    files = JSON.parse(JSON.stringify(D_EXAMPLES.hello));
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
        editor.value.substring(0, s) + '    ' + editor.value.substring(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = s + 4;
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
    if (D_EXAMPLES[val]) {
      files = JSON.parse(JSON.stringify(D_EXAMPLES[val]));
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
    highlight.innerHTML = highlightD(editor.value) + '\n';
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
    input.placeholder = 'filename.d';

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
      if (!name.endsWith('.d')) {
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
        content: `// D Language File: ${name}\nimport std.stdio;\n\nvoid main() {\n    writeln("Hello from ${name}");\n}\n`,
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

      if (!newName.endsWith('.d')) {
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
    files = JSON.parse(JSON.stringify(D_EXAMPLES[val] || D_EXAMPLES.hello));
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
    consoleBody.innerHTML = '<span class="dl-console-placeholder">No errors detected.</span>';
  }

  async function runCode() {
    const seq = ++runSeq;
    setStatus('running');
    outputBody.innerHTML = '<span class="dl-output-placeholder">Compiling and running...</span>';
    consoleBody.innerHTML = '<span class="dl-console-placeholder">No errors detected.</span>';

    const { output, errors } = await executeDCode(files);
    if (seq !== runSeq) return; // Prevent race conditions

    if (output.length > 0) {
      outputBody.innerHTML = '';
      output.forEach((line) => {
        const el = document.createElement('span');
        el.className = 'dl-output-line';
        el.textContent = line;
        outputBody.appendChild(el);
      });
    } else {
      outputBody.innerHTML =
        '<span class="dl-output-placeholder">No standard output produced.</span>';
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
    const placeholder = consoleBody.querySelector('.dl-console-placeholder');
    if (placeholder) placeholder.remove();
    const el = document.createElement('span');
    el.className = 'dl-console-line';
    el.textContent = msg;
    consoleBody.appendChild(el);
  }

  function setStatus(state) {
    const map = {
      ready: ['Ready', 'dl-status-ready'],
      running: ['Running', 'dl-status-running'],
      error: ['Error', 'dl-status-error'],
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `dl-status-badge ${cls}`;
  }
}
