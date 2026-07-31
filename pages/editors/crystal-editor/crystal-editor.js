document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try {
    initCrEditor();
  } catch (e) {
    console.error('CrEditor:', e);
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

/* ─── Crystal Examples ─── */
const CRYSTAL_EXAMPLES = {
  hello: [
    {
      name: 'main.cr',
      content: `puts "Hello, World!"
puts "Welcome to the Crystal Language Editor!"
`,
    },
  ],

  variables: [
    {
      name: 'main.cr',
      content: `# Crystal is statically typed, but uses type inference heavily.
# You rarely need to specify types explicitly.

name = "Algo Verse"  # Inferred as String
year = 2014          # Inferred as Int32
speed = 2.99e8       # Inferred as Float64
is_fast = true       # Inferred as Bool

# You can specify types if you want:
count : Int32 = 42

puts "Platform: #{name}"
puts "Created in: #{year}"
puts "Speed: #{speed}"
puts "Is Fast: #{is_fast}"
puts "Count: #{count}"
`,
    },
  ],

  blocks: [
    {
      name: 'main.cr',
      content: `# Blocks are a core part of Crystal (like Ruby)
3.times do |i|
  puts "Iteration #{i + 1}"
end

puts "\\nArray mapping:"
numbers = [1, 2, 3, 4, 5]
squares = numbers.map { |n| n ** 2 }
puts squares

puts "\\nYielding in methods:"
def repeat_twice
  yield
  yield
end

repeat_twice do
  puts "This is called twice!"
end
`,
    },
  ],

  methods: [
    {
      name: 'main.cr',
      content: `# Methods can have type restrictions (optional but helpful)
def add(x : Int32, y : Int32) : Int32
  x + y
end

# Methods can be overloaded based on types
def multiply(a : Int32, b : Int32)
  a * b
end

def multiply(a : String, b : Int32)
  a * b # String repetition
end

puts "Add: #{add(10, 20)}"
puts "Multiply Ints: #{multiply(5, 4)}"
puts "Multiply String: #{multiply("Hello ", 3)}"

# Default arguments
def greet(name = "World")
  puts "Hello, #{name}!"
end

greet()
greet("Crystal")
`,
    },
  ],

  classes: [
    {
      name: 'main.cr',
      content: `# Defining a Class
class Animal
  # Property macro creates getter and setter automatically
  property name : String

  def initialize(@name)
  end

  def speak
    puts "#{@name} makes a noise."
  end
end

class Dog < Animal
  def speak
    puts "#{@name} barks!"
  end
end

animal = Animal.new("Generic Animal")
animal.speak

dog = Dog.new("Rex")
dog.speak

# Modules for namespacing
module MathUtils
  def self.square(x)
    x * x
  end
end

puts "Square of 5 is #{MathUtils.square(5)}"
`,
    },
  ],
};

/* ─── Piston API Executor ─── */
async function executeCrCode(files) {
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
        language: 'crystal',
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

/* ─── Syntax Highlighting for Crystal ─── */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightCr(code) {
  const lines = code.split('\n');
  const highlighted = lines
    .map((line) => {
      let result = escapeHtml(line);

      // Crystal keywords, built-ins, types
      const regex =
        /(<[^>]+>)|(#.*$)|(`[^`]*`|"[^"]*"|'[^']*')|(\b(abstract|alias|as|as\?|asm|begin|break|case|class|def|do|else|elsif|end|ensure|enum|extend|false|for|fun|if|include|instance_sizeof|is_a\?|lib|macro|module|next|nil|nil\?|of|out|pointerof|private|protected|ptr|puts|p!|p|require|rescue|responds_to\?|return|select|self|sizeof|struct|super|then|true|type|typeof|uninitialized|union|unless|until|when|while|with|yield|Int8|Int16|Int32|Int64|Int128|UInt8|UInt16|UInt32|UInt64|UInt128|Float32|Float64|String|Bool|Char|Symbol|Array|Hash|Tuple|NamedTuple|Proc|Pointer)\b)|(\b\w+(?=\s*[(!]))|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\b(?!\.[a-zA-Z]))/g;

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
function initCrEditor() {
  const editor = document.getElementById('crEditor');
  const highlight = document.getElementById('crHighlight');
  if (!editor || !highlight) return;

  const outputBody = document.getElementById('crOutputBody');
  const consoleBody = document.getElementById('crConsoleBody');
  const runBtn = document.getElementById('crRunBtn');
  const resetBtn = document.getElementById('crResetBtn');
  const copyBtn = document.getElementById('crCopyBtn');
  const saveBtn = document.getElementById('crSaveBtn');
  const exampleSelect = document.getElementById('crExampleSelect');
  const lineNumbers = document.getElementById('crLineNumbers');
  const statusBadge = document.getElementById('crStatusBadge');
  const consoleClear = document.getElementById('crConsoleClear');
  const fileList = document.getElementById('crFileList');
  const newFileBtn = document.getElementById('crNewFileBtn');
  const activeFileNameEl = document.getElementById('crActiveFileName');

  const SAVE_KEY = 'crystal-editor-project';
  let runSeq = 0;

  // Project state
  let files = [];
  let activeIndex = 0;

  // Load project from localStorage or default
  const savedProject = localStorage.getItem(SAVE_KEY);
  if (savedProject) {
    try {
      const parsed = JSON.parse(savedProject);
      files = parsed.files || CRYSTAL_EXAMPLES.hello;
      activeIndex = parsed.activeIndex !== undefined ? parsed.activeIndex : 0;
      if (activeIndex >= files.length) activeIndex = 0;
    } catch (e) {
      files = JSON.parse(JSON.stringify(CRYSTAL_EXAMPLES.hello));
      activeIndex = 0;
    }
  } else {
    files = JSON.parse(JSON.stringify(CRYSTAL_EXAMPLES.hello));
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
        editor.value.substring(0, s) + '  ' + editor.value.substring(editor.selectionEnd); // Crystal uses 2 spaces
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
    if (CRYSTAL_EXAMPLES[val]) {
      files = JSON.parse(JSON.stringify(CRYSTAL_EXAMPLES[val]));
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
    highlight.innerHTML = highlightCr(editor.value) + '\n';
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
    input.placeholder = 'filename.cr';

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
      if (!name.endsWith('.cr')) {
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
        content: `# Crystal File: ${name}\n\nputs "Hello from ${name}"\n`,
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

      if (!newName.endsWith('.cr')) {
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
    files = JSON.parse(JSON.stringify(CRYSTAL_EXAMPLES[val] || CRYSTAL_EXAMPLES.hello));
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
    consoleBody.innerHTML = '<span class="cr-console-placeholder">No errors detected.</span>';
  }

  async function runCode() {
    const seq = ++runSeq;
    setStatus('running');
    outputBody.innerHTML = '<span class="cr-output-placeholder">Compiling and running...</span>';
    consoleBody.innerHTML = '<span class="cr-console-placeholder">No errors detected.</span>';

    const { output, errors } = await executeCrCode(files);
    if (seq !== runSeq) return; // Prevent race conditions

    if (output.length > 0) {
      outputBody.innerHTML = '';
      output.forEach((line) => {
        const el = document.createElement('span');
        el.className = 'cr-output-line';
        el.textContent = line;
        outputBody.appendChild(el);
      });
    } else {
      outputBody.innerHTML =
        '<span class="cr-output-placeholder">No standard output produced.</span>';
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
    const placeholder = consoleBody.querySelector('.cr-console-placeholder');
    if (placeholder) placeholder.remove();
    const el = document.createElement('span');
    el.className = 'cr-console-line';
    el.textContent = msg;
    consoleBody.appendChild(el);
  }

  function setStatus(state) {
    const map = {
      ready: ['Ready', 'cr-status-ready'],
      running: ['Running', 'cr-status-running'],
      error: ['Error', 'cr-status-error'],
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `cr-status-badge ${cls}`;
  }
}
