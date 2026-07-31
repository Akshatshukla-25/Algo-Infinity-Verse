document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try {
    initGroovyEditor();
  } catch (e) {
    console.error('GroovyEditor Error:', e);
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
}

/* ─── Groovy Script Templates & Examples ─── */
const GROOVY_EXAMPLES = {
  hello: [
    {
      name: 'main.groovy',
      content: `// Hello World & Dynamic Groovy Script
def greet(name) {
    return "Hello, \${name}! Welcome to the Groovy Editor."
}

def user = "Developer"
println greet(user)

// Native List and Map Syntax
def numbers = [10, 20, 30, 40]
def profile = [name: 'Alice', role: 'Engineer', points: 95]

println "Numbers: \${numbers}"
println "Profile: \${profile.name} (\${profile.role}) - Score: \${profile['points']}"
`,
    },
  ],

  closures: [
    {
      name: 'main.groovy',
      content: `// Closures & Collection Methods in Groovy
def numbers = 1..10

// Filter even numbers
def evens = numbers.findAll { it % 2 == 0 }

// Transform (map)
def squares = evens.collect { it * it }

// Aggregate (reduce / inject)
def sum = squares.inject(0) { acc, val -> acc + val }

println "Original Range : \${numbers}"
println "Evens          : \${evens}"
println "Squares of Evens: \${squares}"
println "Sum of Squares : \${sum}"
`,
    },
  ],

  gradle: [
    {
      name: 'build.gradle',
      content: `// Sample Gradle Build Script (Groovy DSL)
plugins {
    id 'java'
    id 'application'
}

group = 'com.algoinfinity.app'
version = '1.0.0'

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.apache.commons:commons-lang3:3.12.0'
    testImplementation 'org.junit.jupiter:junit-jupiter:5.9.2'
}

application {
    mainClass = 'com.algoinfinity.app.Main'
}

// Custom Gradle Task Definition
tasks.register('welcomeMessage') {
    doLast {
        println '🚀 Gradle Build Executed Successfully!'
        println "Building version: \${version}"
    }
}
`,
    },
  ],

  builders: [
    {
      name: 'main.groovy',
      content: `// JSON Builder & Metaprogramming in Groovy
import groovy.json.JsonOutput
import groovy.json.JsonBuilder

def builder = new JsonBuilder()
builder.response {
    status "SUCCESS"
    code 200
    data {
        user "Alex"
        skills(['Groovy', 'Java', 'Kotlin', 'Gradle'])
        active true
    }
}

println "Generated JSON:"
println JsonOutput.prettyPrint(builder.toString())

// Dynamic Metaprogramming with ExpandoMetaClass
String.metaClass.shout = { -> delegate.toUpperCase() + "!!!" }
println "groovy builder".shout()
`,
    },
  ],

  pogo: [
    {
      name: 'main.groovy',
      content: `// Plain Old Groovy Object (POGO) & Trait Inheritance

trait Identifiable {
    String id
    void printInfo() {
        println "ID: \${id}"
    }
}

class Student implements Identifiable {
    String name
    int grade
    
    String toString() {
        return "Student[id=\${id}, name=\${name}, grade=\${grade}]"
    }
}

// Instantiate POGO with map-style named arguments
def s = new Student(id: "STU-101", name: "Maria", grade: 12)

s.printInfo()
println s
`,
    },
  ],
};

/* ─── Piston API Executor ─── */
async function executeGroovy(files) {
  if (files.length === 0 || !files.some((f) => f.content.trim())) {
    return { output: [], errors: ['No Groovy code to execute.'] };
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
        language: 'groovy',
        version: '*',
        files: pistonFiles,
        stdin: '',
        args: [],
        compile_timeout: 15000,
        run_timeout: 4000,
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

/* ─── Syntax Highlighting ─── */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightGroovy(code) {
  const lines = code.split('\n');
  const highlighted = lines
    .map((line) => {
      let result = escapeHtml(line);

      // Groovy regex token patterns
      const regex =
        /(<[^>]+>)|(\/\/.*$)|(\/\*[\s\S]*?\*\/)|("\${[^}"]*}"|"\$[^"]*"|"(?:[^"\\]|\\.)*")|('[^']*')|(@[a-zA-Z0-9_]+)|(\b(def|class|interface|trait|enum|import|package|println|print|printf|assert|it|in|as|instanceof|switch|case|default|try|catch|finally|public|private|protected|static|final|return|void|extends|implements|new|tasks|plugins|dependencies|repositories|implementation|testImplementation|id)\b)|(\b(String|Integer|Double|Float|Boolean|List|Map|Closure|Object|JsonBuilder|MarkupBuilder)\b)|(\b(?:\d+\/\d+|\d+(?:\.\d*)?|\.\d+)\b)/g;

      return result.replace(
        regex,
        (m, tag, comment, blockComment, gstring, str, annotation, kw, typeToken, num) => {
          if (tag) return tag;
          if (comment) return '<span class="token comment">' + comment + '</span>';
          if (blockComment) return '<span class="token comment">' + blockComment + '</span>';
          if (gstring) return '<span class="token gstring">' + gstring + '</span>';
          if (str) return '<span class="token string">' + str + '</span>';
          if (annotation) return '<span class="token annotation">' + annotation + '</span>';
          if (kw) return '<span class="token keyword">' + kw + '</span>';
          if (typeToken) return '<span class="token type">' + typeToken + '</span>';
          if (num) return '<span class="token number">' + num + '</span>';
          return m;
        }
      );
    })
    .join('\n');

  return highlighted;
}

/* ─── Init Editor ─── */
function initGroovyEditor() {
  const editor = document.getElementById('groovyEditor');
  const highlight = document.getElementById('groovyHighlight');
  if (!editor || !highlight) return;

  const outputBody = document.getElementById('groovyOutputBody');
  const consoleBody = document.getElementById('groovyConsoleBody');
  const runBtn = document.getElementById('groovyRunBtn');
  const resetBtn = document.getElementById('groovyResetBtn');
  const copyBtn = document.getElementById('groovyCopyBtn');
  const saveBtn = document.getElementById('groovySaveBtn');
  const exampleSelect = document.getElementById('groovyExampleSelect');
  const lineNumbers = document.getElementById('groovyLineNumbers');
  const statusBadge = document.getElementById('groovyStatusBadge');
  const consoleClear = document.getElementById('groovyConsoleClear');
  const fileList = document.getElementById('groovyFileList');
  const newFileBtn = document.getElementById('groovyNewFileBtn');
  const activeFileNameEl = document.getElementById('groovyActiveFileName');

  const SAVE_KEY = 'groovy-editor-project';
  let runSeq = 0;

  // Project state
  let files = [];
  let activeIndex = 0;

  // Load project from localStorage or default
  const savedProject = localStorage.getItem(SAVE_KEY);
  if (savedProject) {
    try {
      const parsed = JSON.parse(savedProject);
      files = parsed.files || GROOVY_EXAMPLES.hello;
      activeIndex = parsed.activeIndex !== undefined ? parsed.activeIndex : 0;
      if (activeIndex >= files.length) activeIndex = 0;
    } catch (e) {
      files = JSON.parse(JSON.stringify(GROOVY_EXAMPLES.hello));
      activeIndex = 0;
    }
  } else {
    files = JSON.parse(JSON.stringify(GROOVY_EXAMPLES.hello));
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
        editor.value.substring(0, s) + '  ' + editor.value.substring(editor.selectionEnd);
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
    if (GROOVY_EXAMPLES[val]) {
      files = JSON.parse(JSON.stringify(GROOVY_EXAMPLES[val]));
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

    editor.scrollTop = 0;
    editor.scrollLeft = 0;
    lineNumbers.scrollTop = 0;
    highlight.scrollTop = 0;
    highlight.scrollLeft = 0;
  }

  function updateSyntaxHighlight() {
    highlight.innerHTML = highlightGroovy(editor.value) + '\n';
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
      nameContainer.innerHTML = `<i class="fas fa-feather-pointed"></i> <span>${escapeHtml(file.name)}</span>`;
      el.appendChild(nameContainer);

      const actionContainer = document.createElement('div');
      actionContainer.className = 'file-item-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'file-action-btn edit';
      editBtn.title = 'Rename File';
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showRenameInput(index);
      });
      actionContainer.appendChild(editBtn);

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
    if (fileList.querySelector('.file-item-input-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'file-item-input-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'file-item-input';
    input.placeholder = 'filename.groovy';
    wrapper.appendChild(input);

    fileList.appendChild(wrapper);
    input.focus();

    const finishNewFile = () => {
      let fileName = input.value.trim();
      if (!fileName) {
        wrapper.remove();
        return;
      }
      if (!fileName.endsWith('.groovy') && !fileName.endsWith('.gradle')) {
        fileName += '.groovy';
      }

      if (files.some((f) => f.name.toLowerCase() === fileName.toLowerCase())) {
        alert('A file with this name already exists.');
        input.focus();
        return;
      }

      const newFile = {
        name: fileName,
        content: '// Write Groovy code here...\n',
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

      if (!newName.endsWith('.groovy') && !newName.endsWith('.gradle')) {
        input.focus();
        return;
      }

      if (files.some((f, idx) => idx !== index && f.name.toLowerCase() === newName.toLowerCase())) {
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
      alert('At least one file must remain in the project.');
      return;
    }

    if (confirm('Are you sure you want to delete this file?')) {
      files.splice(index, 1);
      if (activeIndex >= files.length) {
        activeIndex = files.length - 1;
      }
      saveProject();
      syncEditorState();
      renderFileList();
    }
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
    if (
      confirm(
        'Are you sure you want to reset the current editor contents to template defaults? All local edits will be lost.'
      )
    ) {
      const val = exampleSelect.value;
      files = JSON.parse(JSON.stringify(GROOVY_EXAMPLES[val] || GROOVY_EXAMPLES.hello));
      activeIndex = 0;
      saveProject();
      syncEditorState();
      renderFileList();
      showActionIndicator(resetBtn, '<i class="fas fa-check"></i>');
    }
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
    consoleBody.innerHTML = '<span class="groovy-console-placeholder">No errors.</span>';
  }

  async function runCode() {
    const seq = ++runSeq;
    setStatus('running');
    outputBody.innerHTML =
      '<span class="groovy-output-placeholder">Running Groovy script...</span>';
    consoleBody.innerHTML = '<span class="groovy-console-placeholder">No errors.</span>';

    const { output, errors } = await executeGroovy(files);
    if (seq !== runSeq) return;

    if (output.length > 0) {
      outputBody.innerHTML = '';
      output.forEach((line) => {
        const el = document.createElement('span');
        el.className = 'groovy-output-line';
        el.textContent = line;
        outputBody.appendChild(el);
      });
    } else {
      outputBody.innerHTML =
        '<span class="groovy-output-placeholder">No standard output produced.</span>';
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
    const placeholder = consoleBody.querySelector('.groovy-console-placeholder');
    if (placeholder) placeholder.remove();
    const el = document.createElement('span');
    el.className = 'groovy-console-line';
    el.textContent = msg;
    consoleBody.appendChild(el);
  }

  function setStatus(state) {
    const map = {
      ready: ['Ready', 'groovy-status-ready'],
      running: ['Running', 'groovy-status-running'],
      error: ['Error', 'groovy-status-error'],
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `groovy-status-badge ${cls}`;
  }
}

window.addEventListener('resize', () => {
  const lineNumbers = document.getElementById('groovyLineNumbers');
  const editor = document.getElementById('groovyEditor');
  if (lineNumbers && editor) {
    const count = editor.value.split('\n').length;
    lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join(
      '\n'
    );
  }
});
