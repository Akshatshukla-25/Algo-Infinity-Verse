document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try {
    initVbNetEditor();
  } catch (e) {
    console.error('VbNetEditor Error:', e);
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

/* ─── VB.NET Starters & Snippets ─── */
const VBNET_EXAMPLES = {
  hello: [
    {
      name: 'Program.vb',
      content: `' Visual Basic .NET - Hello World & Module Basics
Imports System

Module Program
    Sub Main(args As String())
        Dim greeting As String = "Hello, World!"
        Dim learnerName As String = "VB.NET Learner"
        
        Console.WriteLine(greeting)
        Console.WriteLine($"Welcome to the VB.NET Editor, {learnerName}!")
        
        Dim num1 As Integer = 15
        Dim num2 As Integer = 27
        Console.WriteLine($"{num1} + {num2} = {num1 + num2}")
    End Sub
End Module
`,
    },
  ],

  classes: [
    {
      name: 'Program.vb',
      content: `' Visual Basic .NET - Classes & Auto-Implemented Properties
Imports System

Public Class Person
    ' Auto-Implemented Properties
    Public Property Name As String
    Public Property Age As Integer

    ' Constructor
    Public Sub New(name As String, age As Integer)
        Me.Name = name
        Me.Age = age
    End Sub

    Public Sub DisplayInfo()
        Console.WriteLine($"Person: {Name}, Age: {Age}")
    End Sub
End Class

Module Program
    Sub Main()
        Dim p1 As New Person("Alice", 25)
        Dim p2 As New Person("Bob", 30)

        p1.DisplayInfo()
        p2.DisplayInfo()
    End Sub
End Module
`,
    },
  ],

  control: [
    {
      name: 'Program.vb',
      content: `' Visual Basic .NET - Control Flow & LINQ Queries
Imports System
Imports System.Collections.Generic
Imports System.Linq

Module Program
    Sub Main()
        Dim numbers As New List(Of Integer) From {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

        ' LINQ Query Syntax
        Dim evenNumbers = From num In numbers
                          Where num Mod 2 = 0
                          Select num

        Console.WriteLine("Even numbers using LINQ:")
        For Each n As Integer In evenNumbers
            Console.Write($"{n} ")
        Next
        Console.WriteLine()

        ' Conditional Logic
        Dim score As Integer = 88
        If score >= 90 Then
            Console.WriteLine("Grade: A")
        ElseIf score >= 80 Then
            Console.WriteLine("Grade: B")
        Else
            Console.WriteLine("Grade: C")
        End If
    End Sub
End Module
`,
    },
  ],

  methods: [
    {
      name: 'Program.vb',
      content: `' Visual Basic .NET - Functions, Subroutines & Error Handling
Imports System

Module Program
    ' Function returning a value
    Function Multiply(a As Integer, b As Integer) As Integer
        Return a * b
    End Function

    ' Subroutine with Try-Catch
    Sub SafeDivide(a As Double, b As Double)
        Try
            If b = 0 Then
                Throw New DivideByZeroException("Cannot divide by zero.")
            End If
            Dim result As Double = a / b
            Console.WriteLine($"{a} / {b} = {result}")
        Catch ex As Exception
            Console.WriteLine($"Error: {ex.Message}")
        Finally
            Console.WriteLine("Operation attempt completed.")
        End Try
    End Sub

    Sub Main()
        Dim product As Integer = Multiply(6, 7)
        Console.WriteLine($"6 * 7 = {product}")
        
        SafeDivide(10, 2)
        SafeDivide(10, 0)
    End Sub
End Module
`,
    },
  ],

  oop: [
    {
      name: 'Program.vb',
      content: `' Visual Basic .NET - Inheritance & Interface Implementation
Imports System

Public Interface IPrintable
    Sub PrintDetails()
End Interface

Public Class Employee
    Implements IPrintable

    Public Property EmployeeId As String
    Public Property FullName As String

    Public Sub New(id As String, name As String)
        Me.EmployeeId = id
        Me.FullName = name
    End Sub

    Public Sub PrintDetails() Implements IPrintable.PrintDetails
        Console.WriteLine($"Employee [{EmployeeId}]: {FullName}")
    End Sub
End Class

Module Program
    Sub Main()
        Dim emp As IPrintable = New Employee("EMP-2026", "Sarah Jenkins")
        emp.PrintDetails()
    End Sub
End Module
`,
    },
  ],
};

/* ─── Piston API Executor ─── */
async function executeVbNet(files) {
  if (files.length === 0 || !files.some((f) => f.content.trim())) {
    return { output: [], errors: ['No VB.NET code to execute.'] };
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
        language: 'vb.net',
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

/* ─── Case-Insensitive Syntax Highlighting ─── */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightVbNet(code) {
  const lines = code.split('\n');
  const highlighted = lines
    .map((line) => {
      let result = escapeHtml(line);

      // VB.NET regex token patterns (case-insensitive flag i)
      const regex =
        /(<[^>]+>)|('.*$|REM\b.*$)|("[^"]*")|(\b(Imports|Module|Class|Structure|Interface|Sub|Function|End|Dim|As|Public|Private|Protected|Shared|Property|Get|Set|If|Then|Else|ElseIf|For|To|Step|Next|Each|In|While|Loop|Do|Select|Case|Try|Catch|Finally|Throw|Return|New|Inherits|Implements|Me|MyBase|Not|AndAlso|OrElse|From|Where|Select|OrderBy|Descending|Ascending)\b)|(\b(Integer|Long|Short|Double|Single|Decimal|String|Boolean|Char|Byte|Object|Console|List|Dictionary|Enumerable)\b)|(\b(?:\d+\/\d+|\d+(?:\.\d*)?|\.\d+)\b)|(=|&amp;|\+|-|\*|\/|\\|&lt;|&gt;|&lt;=|&gt;=|&lt;&gt;)/gi;

      return result.replace(regex, (m, tag, comment, str, kw, typeToken, num, op) => {
        if (tag) return tag;
        if (comment) return '<span class="token comment">' + comment + '</span>';
        if (str) return '<span class="token string">' + str + '</span>';
        if (kw) return '<span class="token keyword">' + kw + '</span>';
        if (typeToken) return '<span class="token type">' + typeToken + '</span>';
        if (num) return '<span class="token number">' + num + '</span>';
        if (op) return '<span class="token operator">' + op + '</span>';
        return m;
      });
    })
    .join('\n');

  return highlighted;
}

/* ─── Init Editor ─── */
function initVbNetEditor() {
  const editor = document.getElementById('vbnetEditor');
  const highlight = document.getElementById('vbnetHighlight');
  if (!editor || !highlight) return;

  const outputBody = document.getElementById('vbnetOutputBody');
  const consoleBody = document.getElementById('vbnetConsoleBody');
  const runBtn = document.getElementById('vbnetRunBtn');
  const resetBtn = document.getElementById('vbnetResetBtn');
  const copyBtn = document.getElementById('vbnetCopyBtn');
  const saveBtn = document.getElementById('vbnetSaveBtn');
  const exampleSelect = document.getElementById('vbnetExampleSelect');
  const lineNumbers = document.getElementById('vbnetLineNumbers');
  const statusBadge = document.getElementById('vbnetStatusBadge');
  const consoleClear = document.getElementById('vbnetConsoleClear');
  const fileList = document.getElementById('vbnetFileList');
  const newFileBtn = document.getElementById('vbnetNewFileBtn');
  const activeFileNameEl = document.getElementById('vbnetActiveFileName');

  const SAVE_KEY = 'vbnet-editor-project';
  let runSeq = 0;

  // Project state
  let files = [];
  let activeIndex = 0;

  // Load project from localStorage or default
  const savedProject = localStorage.getItem(SAVE_KEY);
  if (savedProject) {
    try {
      const parsed = JSON.parse(savedProject);
      files = parsed.files || VBNET_EXAMPLES.hello;
      activeIndex = parsed.activeIndex !== undefined ? parsed.activeIndex : 0;
      if (activeIndex >= files.length) activeIndex = 0;
    } catch (e) {
      files = JSON.parse(JSON.stringify(VBNET_EXAMPLES.hello));
      activeIndex = 0;
    }
  } else {
    files = JSON.parse(JSON.stringify(VBNET_EXAMPLES.hello));
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
    if (VBNET_EXAMPLES[val]) {
      files = JSON.parse(JSON.stringify(VBNET_EXAMPLES[val]));
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
    highlight.innerHTML = highlightVbNet(editor.value) + '\n';
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
      nameContainer.innerHTML = `<i class="fas fa-cubes"></i> <span>${escapeHtml(file.name)}</span>`;
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
    input.placeholder = 'filename.vb';
    wrapper.appendChild(input);

    fileList.appendChild(wrapper);
    input.focus();

    const finishNewFile = () => {
      let fileName = input.value.trim();
      if (!fileName) {
        wrapper.remove();
        return;
      }
      if (!fileName.endsWith('.vb')) {
        fileName += '.vb';
      }

      if (files.some((f) => f.name.toLowerCase() === fileName.toLowerCase())) {
        alert('A file with this name already exists.');
        input.focus();
        return;
      }

      const newFile = {
        name: fileName,
        content: "' Write VB.NET code here...\n",
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

      if (!newName.endsWith('.vb')) {
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
      files = JSON.parse(JSON.stringify(VBNET_EXAMPLES[val] || VBNET_EXAMPLES.hello));
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
    consoleBody.innerHTML = '<span class="vbnet-console-placeholder">No errors.</span>';
  }

  async function runCode() {
    const seq = ++runSeq;
    setStatus('running');
    outputBody.innerHTML = '<span class="vbnet-output-placeholder">Running VB.NET code...</span>';
    consoleBody.innerHTML = '<span class="vbnet-console-placeholder">No errors.</span>';

    const { output, errors } = await executeVbNet(files);
    if (seq !== runSeq) return;

    if (output.length > 0) {
      outputBody.innerHTML = '';
      output.forEach((line) => {
        const el = document.createElement('span');
        el.className = 'vbnet-output-line';
        el.textContent = line;
        outputBody.appendChild(el);
      });
    } else {
      outputBody.innerHTML =
        '<span class="vbnet-output-placeholder">No standard output produced.</span>';
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
    const placeholder = consoleBody.querySelector('.vbnet-console-placeholder');
    if (placeholder) placeholder.remove();
    const el = document.createElement('span');
    el.className = 'vbnet-console-line';
    el.textContent = msg;
    consoleBody.appendChild(el);
  }

  function setStatus(state) {
    const map = {
      ready: ['Ready', 'vbnet-status-ready'],
      running: ['Running', 'vbnet-status-running'],
      error: ['Error', 'vbnet-status-error'],
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `vbnet-status-badge ${cls}`;
  }
}

window.addEventListener('resize', () => {
  const lineNumbers = document.getElementById('vbnetLineNumbers');
  const editor = document.getElementById('vbnetEditor');
  if (lineNumbers && editor) {
    const count = editor.value.split('\n').length;
    lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join(
      '\n'
    );
  }
});
