document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try {
    initAdEditor();
  } catch (e) {
    console.error('AdEditor:', e);
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

/* ─── Ada Examples ─── */
const ADA_EXAMPLES = {
  hello: [
    {
      name: 'main.adb',
      content: `with Ada.Text_IO; use Ada.Text_IO;

procedure Main is
begin
   Put_Line ("Hello, World!");
   Put_Line ("Welcome to the Ada Language Editor!");
end Main;
`,
    },
  ],

  variables: [
    {
      name: 'main.adb',
      content: `with Ada.Text_IO; use Ada.Text_IO;
with Ada.Integer_Text_IO; use Ada.Integer_Text_IO;

procedure Main is
   -- Strongly typed declarations
   Age    : Integer := 25;
   Score  : Float   := 98.5;
   Is_Dev : Boolean := True;
   
   -- Subtypes can constrain values safely
   subtype Dice_Roll is Integer range 1 .. 6;
   Roll : Dice_Roll := 4;
begin
   Put ("Age: ");
   Put (Age, Width => 0);
   New_Line;
   
   Put_Line ("Score: " & Float'Image (Score));
   Put_Line ("Developer: " & Boolean'Image (Is_Dev));
   Put_Line ("Dice Roll: " & Integer'Image (Roll));
end Main;
`,
    },
  ],

  loops: [
    {
      name: 'main.adb',
      content: `with Ada.Text_IO; use Ada.Text_IO;

procedure Main is
begin
   Put_Line ("-- For Loop --");
   for I in 1 .. 5 loop
      Put_Line ("Iteration:" & Integer'Image (I));
   end loop;

   Put_Line ("-- While Loop --");
   declare
      Count : Integer := 3;
   begin
      while Count > 0 loop
         Put_Line ("Countdown:" & Integer'Image (Count));
         Count := Count - 1;
      end loop;
   end;
   
   Put_Line ("-- Basic Loop with Exit --");
   declare
      X : Integer := 0;
   begin
      loop
         X := X + 1;
         exit when X = 4;
         Put_Line ("X is" & Integer'Image (X));
      end loop;
   end;
end Main;
`,
    },
  ],

  procedures: [
    {
      name: 'main.adb',
      content: `with Ada.Text_IO; use Ada.Text_IO;

procedure Main is

   -- A Procedure doesn't return a value directly (like void)
   -- but can use 'out' parameters
   procedure Add (A, B : in Integer; Result : out Integer) is
   begin
      Result := A + B;
   end Add;

   -- A Function returns a value
   function Multiply (A, B : Integer) return Integer is
   begin
      return A * B;
   end Multiply;

   Sum  : Integer;
   Prod : Integer;
begin
   Add (10, 20, Sum);
   Put_Line ("10 + 20 = " & Integer'Image (Sum));
   
   Prod := Multiply (5, 4);
   Put_Line ("5 * 4 = " & Integer'Image (Prod));
end Main;
`,
    },
  ],

  packages: [
    {
      name: 'math_utils.ads',
      content: `package Math_Utils is
   function Square (X : Integer) return Integer;
end Math_Utils;
`,
    },
    {
      name: 'math_utils.adb',
      content: `package body Math_Utils is
   function Square (X : Integer) return Integer is
   begin
      return X * X;
   end Square;
end Math_Utils;
`,
    },
    {
      name: 'main.adb',
      content: `with Ada.Text_IO; use Ada.Text_IO;
with Math_Utils;

procedure Main is
   Val : Integer := 7;
   Result : Integer;
begin
   Result := Math_Utils.Square (Val);
   Put_Line ("The square of " & Integer'Image(Val) & " is " & Integer'Image(Result));
end Main;
`,
    },
  ],
};

/* ─── Piston API Executor ─── */
async function executeAdCode(files) {
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
        language: 'ada',
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

/* ─── Syntax Highlighting for Ada ─── */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightAd(code) {
  const lines = code.split('\n');
  const highlighted = lines
    .map((line) => {
      let result = escapeHtml(line);

      // Ada is case-insensitive, so we use 'i' flag for keywords
      // Keywords
      const regex =
        /(<[^>]+>)|(--.*$)|(`[^`]*`|"[^"]*"|'[^']*')|(\b(abort|abs|abstract|accept|access|aliased|all|and|array|at|begin|body|case|constant|declare|delay|delta|digits|do|else|elsif|end|entry|exception|exit|for|function|generic|goto|if|in|interface|is|limited|loop|mod|new|not|null|of|or|others|out|overriding|package|pragma|private|procedure|protected|raise|range|record|rem|renames|requeue|return|reverse|select|separate|some|subtype|synchronized|tagged|task|terminate|then|type|until|use|when|while|with|xor)\b)|(\b[A-Za-z_][A-Za-z0-9_]*(?=\s*[(!]))|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\b(?!\.[a-zA-Z]))/gi;

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
function initAdEditor() {
  const editor = document.getElementById('adEditor');
  const highlight = document.getElementById('adHighlight');
  if (!editor || !highlight) return;

  const outputBody = document.getElementById('adOutputBody');
  const consoleBody = document.getElementById('adConsoleBody');
  const runBtn = document.getElementById('adRunBtn');
  const resetBtn = document.getElementById('adResetBtn');
  const copyBtn = document.getElementById('adCopyBtn');
  const saveBtn = document.getElementById('adSaveBtn');
  const exampleSelect = document.getElementById('adExampleSelect');
  const lineNumbers = document.getElementById('adLineNumbers');
  const statusBadge = document.getElementById('adStatusBadge');
  const consoleClear = document.getElementById('adConsoleClear');
  const fileList = document.getElementById('adFileList');
  const newFileBtn = document.getElementById('adNewFileBtn');
  const activeFileNameEl = document.getElementById('adActiveFileName');

  const SAVE_KEY = 'ada-editor-project';
  let runSeq = 0;

  // Project state
  let files = [];
  let activeIndex = 0;

  // Load project from localStorage or default
  const savedProject = localStorage.getItem(SAVE_KEY);
  if (savedProject) {
    try {
      const parsed = JSON.parse(savedProject);
      files = parsed.files || ADA_EXAMPLES.hello;
      activeIndex = parsed.activeIndex !== undefined ? parsed.activeIndex : 0;
      if (activeIndex >= files.length) activeIndex = 0;
    } catch (e) {
      files = JSON.parse(JSON.stringify(ADA_EXAMPLES.hello));
      activeIndex = 0;
    }
  } else {
    files = JSON.parse(JSON.stringify(ADA_EXAMPLES.hello));
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
      // Ada conventionally uses 3 spaces!
      editor.value =
        editor.value.substring(0, s) + '   ' + editor.value.substring(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = s + 3;
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
    if (ADA_EXAMPLES[val]) {
      files = JSON.parse(JSON.stringify(ADA_EXAMPLES[val]));
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
    highlight.innerHTML = highlightAd(editor.value) + '\n';
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
    input.placeholder = 'filename.adb';

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
      if (!name.endsWith('.adb') && !name.endsWith('.ads')) {
        void 0;
        input.focus();
        return;
      }

      if (files.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
        void 0;
        input.focus();
        return;
      }

      // Basic procedure name derives from filename
      const procName = name.split('.')[0];
      const Capitalized = procName.charAt(0).toUpperCase() + procName.slice(1);

      const isSpec = name.endsWith('.ads');

      let content = '';
      if (isSpec) {
        content = `package ${Capitalized} is\n   -- Spec content here\nend ${Capitalized};\n`;
      } else {
        content = `with Ada.Text_IO; use Ada.Text_IO;\n\nprocedure ${Capitalized} is\nbegin\n   Put_Line ("Hello from ${name}");\nend ${Capitalized};\n`;
      }

      const newFile = {
        name: name,
        content: content,
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

      if (!newName.endsWith('.adb') && !newName.endsWith('.ads')) {
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
    files = JSON.parse(JSON.stringify(ADA_EXAMPLES[val] || ADA_EXAMPLES.hello));
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
    consoleBody.innerHTML = '<span class="ad-console-placeholder">No errors detected.</span>';
  }

  async function runCode() {
    const seq = ++runSeq;
    setStatus('running');
    outputBody.innerHTML = '<span class="ad-output-placeholder">Compiling and running...</span>';
    consoleBody.innerHTML = '<span class="ad-console-placeholder">No errors detected.</span>';

    const { output, errors } = await executeAdCode(files);
    if (seq !== runSeq) return; // Prevent race conditions

    if (output.length > 0) {
      outputBody.innerHTML = '';
      output.forEach((line) => {
        const el = document.createElement('span');
        el.className = 'ad-output-line';
        el.textContent = line;
        outputBody.appendChild(el);
      });
    } else {
      outputBody.innerHTML =
        '<span class="ad-output-placeholder">No standard output produced.</span>';
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
    const placeholder = consoleBody.querySelector('.ad-console-placeholder');
    if (placeholder) placeholder.remove();
    const el = document.createElement('span');
    el.className = 'ad-console-line';
    el.textContent = msg;
    consoleBody.appendChild(el);
  }

  function setStatus(state) {
    const map = {
      ready: ['Ready', 'ad-status-ready'],
      running: ['Running', 'ad-status-running'],
      error: ['Error', 'ad-status-error'],
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `ad-status-badge ${cls}`;
  }
}
