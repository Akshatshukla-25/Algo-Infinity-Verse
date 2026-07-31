document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try {
    initPrologEditor();
  } catch (e) {
    console.error('PrologEditor Error:', e);
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

/* ─── Prolog Logic Programming Examples ─── */
const PROLOG_EXAMPLES = {
  family: {
    files: [
      {
        name: 'family.pl',
        content: `% Family Tree Knowledge Base

% Facts: parent(Parent, Child)
parent(john, bob).
parent(mary, bob).
parent(john, alice).
parent(mary, alice).
parent(bob, charlie).
parent(bob, diana).

% Facts: male/1 and female/1
male(john).
male(bob).
male(charlie).
female(mary).
female(alice).
female(diana).

% Rules
father(X, Y) :- parent(X, Y), male(X).
mother(X, Y) :- parent(X, Y), female(X).

sibling(X, Y) :- parent(Z, X), parent(Z, Y), X \\= Y.

% Recursive Rule: ancestor(Ancestor, Descendant)
ancestor(X, Y) :- parent(X, Y).
ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y).
`,
      },
    ],
    defaultQuery: 'ancestor(X, charlie).',
  },

  listops: {
    files: [
      {
        name: 'listops.pl',
        content: `% List Operations & Append

% my_append(List1, List2, Combined)
my_append([], L, L).
my_append([H|T], L2, [H|L3]) :-
    my_append(T, L2, L3).

% my_member(Element, List)
my_member(X, [X|_]).
my_member(X, [_|T]) :-
    my_member(X, T).

% my_length(List, Length)
my_length([], 0).
my_length([_|T], N) :-
    my_length(T, N1),
    N is N1 + 1.

% my_reverse(List, Reversed)
my_reverse(L, R) :-
    rev_acc(L, [], R).

rev_acc([], Acc, Acc).
rev_acc([H|T], Acc, R) :-
    rev_acc(T, [H|Acc], R).
`,
      },
    ],
    defaultQuery: 'my_append([1, 2], [3, 4], Result).',
  },

  math: {
    files: [
      {
        name: 'math.pl',
        content: `% Arithmetic & Recursion in Prolog

% factorial(N, Result)
factorial(0, 1).
factorial(N, F) :-
    N > 0,
    N1 is N - 1,
    factorial(N1, F1),
    F is N * F1.

% fibonacci(N, Result)
fibonacci(0, 0).
fibonacci(1, 1).
fibonacci(N, F) :-
    N > 1,
    N1 is N - 1,
    N2 is N - 2,
    fibonacci(N1, F1),
    fibonacci(N2, F2),
    F is F1 + F2.

% Greatest Common Divisor: gcd(A, B, Result)
gcd(A, 0, A) :- A > 0.
gcd(A, B, G) :-
    B > 0,
    R is A mod B,
    gcd(B, R, G).
`,
      },
    ],
    defaultQuery: 'factorial(5, Result).',
  },

  graph: {
    files: [
      {
        name: 'graph.pl',
        content: `% Directed Graph & Pathfinding

% Facts: edge(From, To)
edge(a, b).
edge(b, c).
edge(c, d).
edge(a, c).
edge(c, e).
edge(e, d).

% Pathfinding with visited set to prevent cycles
path(Start, End, Path) :-
    travel(Start, End, [Start], Q),
    reverse(Q, Path).

travel(Node, Node, Visited, Visited).
travel(Start, End, Visited, Path) :-
    edge(Start, Next),
    \\+ member(Next, Visited),
    travel(Next, End, [Next|Visited], Path).
`,
      },
    ],
    defaultQuery: 'path(a, d, Path).',
  },

  nqueens: {
    files: [
      {
        name: 'nqueens.pl',
        content: `% N-Queens Constraint Logic Solver

queens(N, Queens) :-
    length(Queens, N),
    range(1, N, List),
    permutation(List, Queens),
    safe(Queens).

safe([]).
safe([Queen|Others]) :-
    safe(Others),
    no_attack(Queen, Others, 1).

no_attack(_, [], _).
no_attack(Q, [Q1|Others], D) :-
    Q \\= Q1,
    D \\= abs(Q - Q1),
    D1 is D + 1,
    no_attack(Q, Others, D1).

range(Low, High, []) :- Low > High.
range(Low, High, [Low|Rest]) :-
    Low =< High,
    Next is Low + 1,
    range(Next, High, Rest).
`,
      },
    ],
    defaultQuery: 'queens(4, Queens).',
  },
};

/* ─── Syntax Highlighting ─── */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightProlog(code) {
  const lines = code.split('\n');
  const highlighted = lines
    .map((line) => {
      let result = escapeHtml(line);

      // Prolog token regex patterns
      const regex =
        /(<[^>]+>)|(%.*$)|(\/\*[\s\S]*?\*\/)|("[^"]*"|'[^']*')|(\b(is|append|member|length|reverse|nl|write|writeln|read|fail|true|false|not|asserta|assertz|retract|consult|listing|halt)\b)|(\b[A-Z_][a-zA-Z0-9_]*\b)|(:-|\?-|-->|\\=|=:=|=\\=|=|\+|-|\*|\/|<|>|=<|>=|=..)|(\b(?:\d+\/\d+|\d+(?:\.\d*)?|\.\d+)\b)|(\b[a-z][a-zA-Z0-9_]*\b)/g;

      return result.replace(
        regex,
        (m, tag, comment, blockComment, str, builtin, variable, operator, num, atom) => {
          if (tag) return tag;
          if (comment) return '<span class="token comment">' + comment + '</span>';
          if (blockComment) return '<span class="token comment">' + blockComment + '</span>';
          if (str) return '<span class="token string">' + str + '</span>';
          if (builtin) return '<span class="token builtin">' + builtin + '</span>';
          if (variable) return '<span class="token variable">' + variable + '</span>';
          if (operator) return '<span class="token keyword">' + operator + '</span>';
          if (num) return '<span class="token number">' + num + '</span>';
          if (atom) return '<span class="token atom">' + atom + '</span>';
          return m;
        }
      );
    })
    .join('\n');

  return highlighted;
}

/* ─── Execution Engine ─── */
async function executeProlog(files, queryGoal) {
  if (files.length === 0 || !files.some((f) => f.content.trim())) {
    return { output: [], errors: ['No Prolog code to consult.'] };
  }

  const fullProgram = files.map((f) => f.content).join('\n\n');
  const goal = queryGoal && queryGoal.trim() ? queryGoal.trim() : 'true.';

  // Check if Tau Prolog is loaded in browser
  if (typeof window.pl !== 'undefined') {
    try {
      const session = window.pl.create(1000);
      const errors = [];
      const output = [];

      let consultSuccess = false;

      session.consult(fullProgram, {
        success: () => {
          consultSuccess = true;
        },
        error: (err) => {
          errors.push('Consult Error: ' + window.pl.format_answer(err));
        },
      });

      if (!consultSuccess && errors.length > 0) {
        return { output: [], errors };
      }

      // Format query goal ending with period
      const cleanGoal = goal.endsWith('.') ? goal : goal + '.';

      let querySuccess = false;
      session.query(cleanGoal, {
        success: () => {
          querySuccess = true;
        },
        error: (err) => {
          errors.push('Query Error: ' + window.pl.format_answer(err));
        },
      });

      if (!querySuccess) {
        return { output, errors };
      }

      let solutionCount = 0;
      const MAX_SOLUTIONS = 20;

      await new Promise((resolve) => {
        const fetchNextAnswer = () => {
          session.answer((answer) => {
            if (answer === false) {
              if (solutionCount === 0) {
                output.push('false.');
              }
              resolve();
            } else if (window.pl.type.is_error(answer)) {
              errors.push('Execution Error: ' + window.pl.format_answer(answer));
              resolve();
            } else {
              solutionCount++;
              const formatted = window.pl.format_answer(answer);
              output.push(formatted || 'true.');

              if (solutionCount < MAX_SOLUTIONS) {
                fetchNextAnswer();
              } else {
                output.push('... [Output limited to 20 solutions]');
                resolve();
              }
            }
          });
        };
        fetchNextAnswer();
      });

      return { output, errors };
    } catch (e) {
      console.warn('Tau Prolog execution error, falling back to Piston API:', e);
    }
  }

  // Fallback to Piston API execution
  try {
    const mainContent =
      fullProgram +
      '\n\n:- initialization(main).\nmain :- (' +
      goal.replace(/\.$/, '') +
      "), write('true.'), nl, halt; write('false.'), nl, halt.\n";

    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'prolog',
        version: '*',
        files: [{ name: 'main.pl', content: mainContent }],
        stdin: '',
        run_timeout: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error('Piston API failed: ' + response.statusText);
    }

    const data = await response.json();
    const output = [];
    const errors = [];

    if (data.compile?.stderr) errors.push(...data.compile.stderr.split('\n').filter(Boolean));
    if (data.run?.stderr) errors.push(...data.run.stderr.split('\n').filter(Boolean));
    if (data.run?.stdout) output.push(...data.run.stdout.split('\n'));

    if (output.length === 0 && errors.length === 0) {
      output.push('Query completed with no output.');
    }

    return { output, errors };
  } catch (err) {
    return { output: [], errors: ['Network / Execution Error: ' + err.message] };
  }
}

/* ─── Init Editor ─── */
function initPrologEditor() {
  const editor = document.getElementById('prologEditor');
  const highlight = document.getElementById('prologHighlight');
  if (!editor || !highlight) return;

  const outputBody = document.getElementById('prologOutputBody');
  const consoleBody = document.getElementById('prologConsoleBody');
  const queryInput = document.getElementById('prologQueryInput');
  const queryBtn = document.getElementById('prologQueryBtn');
  const runBtn = document.getElementById('prologRunBtn');
  const resetBtn = document.getElementById('prologResetBtn');
  const copyBtn = document.getElementById('prologCopyBtn');
  const saveBtn = document.getElementById('prologSaveBtn');
  const exampleSelect = document.getElementById('prologExampleSelect');
  const lineNumbers = document.getElementById('prologLineNumbers');
  const statusBadge = document.getElementById('prologStatusBadge');
  const consoleClear = document.getElementById('prologConsoleClear');
  const fileList = document.getElementById('prologFileList');
  const newFileBtn = document.getElementById('prologNewFileBtn');
  const activeFileNameEl = document.getElementById('prologActiveFileName');

  const SAVE_KEY = 'prolog-editor-project';
  let runSeq = 0;

  // Project state
  let files = [];
  let activeIndex = 0;

  // Load project from localStorage or default
  const savedProject = localStorage.getItem(SAVE_KEY);
  if (savedProject) {
    try {
      const parsed = JSON.parse(savedProject);
      files = parsed.files || PROLOG_EXAMPLES.family.files;
      activeIndex = parsed.activeIndex !== undefined ? parsed.activeIndex : 0;
      if (activeIndex >= files.length) activeIndex = 0;
      if (parsed.queryGoal && queryInput) queryInput.value = parsed.queryGoal;
    } catch (e) {
      files = JSON.parse(JSON.stringify(PROLOG_EXAMPLES.family.files));
      activeIndex = 0;
    }
  } else {
    files = JSON.parse(JSON.stringify(PROLOG_EXAMPLES.family.files));
    activeIndex = 0;
    if (queryInput) queryInput.value = PROLOG_EXAMPLES.family.defaultQuery;
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

  if (queryInput) {
    queryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        runCode();
      }
    });
  }

  // Actions
  runBtn.addEventListener('click', runCode);
  if (queryBtn) queryBtn.addEventListener('click', runCode);
  resetBtn.addEventListener('click', resetProject);
  copyBtn.addEventListener('click', copyCurrentFileCode);
  saveBtn.addEventListener('click', saveProject);
  consoleClear.addEventListener('click', clearConsole);

  exampleSelect.addEventListener('change', () => {
    const val = exampleSelect.value;
    if (PROLOG_EXAMPLES[val]) {
      files = JSON.parse(JSON.stringify(PROLOG_EXAMPLES[val].files));
      activeIndex = 0;
      if (queryInput) queryInput.value = PROLOG_EXAMPLES[val].defaultQuery;
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
    highlight.innerHTML = highlightProlog(editor.value) + '\n';
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
      nameContainer.innerHTML = `<i class="fas fa-diagram-project"></i> <span>${escapeHtml(file.name)}</span>`;
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
    input.placeholder = 'filename.pl';
    wrapper.appendChild(input);

    fileList.appendChild(wrapper);
    input.focus();

    const finishNewFile = () => {
      let fileName = input.value.trim();
      if (!fileName) {
        wrapper.remove();
        return;
      }
      if (!fileName.endsWith('.pl')) {
        fileName += '.pl';
      }

      if (files.some((f) => f.name.toLowerCase() === fileName.toLowerCase())) {
        alert('A file with this name already exists.');
        input.focus();
        return;
      }

      const newFile = {
        name: fileName,
        content: '% Write Prolog code here...\n',
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

      if (!newName.endsWith('.pl')) {
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
        queryGoal: queryInput ? queryInput.value : '',
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
      files = JSON.parse(
        JSON.stringify(PROLOG_EXAMPLES[val]?.files || PROLOG_EXAMPLES.family.files)
      );
      activeIndex = 0;
      if (queryInput)
        queryInput.value = PROLOG_EXAMPLES[val]?.defaultQuery || 'ancestor(X, charlie).';
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
    consoleBody.innerHTML = '<span class="prolog-console-placeholder">No syntax errors.</span>';
  }

  async function runCode() {
    const seq = ++runSeq;
    setStatus('running');
    outputBody.innerHTML = '<span class="prolog-output-placeholder">Running Prolog query...</span>';
    consoleBody.innerHTML = '<span class="prolog-console-placeholder">No syntax errors.</span>';

    const goal = queryInput ? queryInput.value : '';
    const { output, errors } = await executeProlog(files, goal);
    if (seq !== runSeq) return;

    if (output.length > 0) {
      outputBody.innerHTML = '';
      output.forEach((line) => {
        const el = document.createElement('span');
        el.className = 'prolog-output-line';
        el.textContent = line;
        outputBody.appendChild(el);
      });
    } else {
      outputBody.innerHTML = '<span class="prolog-output-placeholder">No solutions found.</span>';
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
    const placeholder = consoleBody.querySelector('.prolog-console-placeholder');
    if (placeholder) placeholder.remove();
    const el = document.createElement('span');
    el.className = 'prolog-console-line';
    el.textContent = msg;
    consoleBody.appendChild(el);
  }

  function setStatus(state) {
    const map = {
      ready: ['Ready', 'prolog-status-ready'],
      running: ['Running', 'prolog-status-running'],
      error: ['Error', 'prolog-status-error'],
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `prolog-status-badge ${cls}`;
  }
}

window.addEventListener('resize', () => {
  const lineNumbers = document.getElementById('prologLineNumbers');
  const editor = document.getElementById('prologEditor');
  if (lineNumbers && editor) {
    const count = editor.value.split('\n').length;
    lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join(
      '\n'
    );
  }
});
