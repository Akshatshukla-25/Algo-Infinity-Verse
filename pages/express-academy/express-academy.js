// ─── Curriculum data is loaded from express-academy-data.js ───

// --- State & Progress ---
let state = {
  activeModuleId: curriculum[0].id,
  activeLessonId: curriculum[0].lessons[0].id,
  activeTab: 'lesson',
  completedItems: [],
  quizAnswers: {},
};

// Load state from local storage
function loadProgress() {
  try {
    const saved = localStorage.getItem('expressHubProgress');
    if (saved) {
      state.completedItems = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load progress', e);
  }
}

// Save state to local storage and update UI
function saveProgress() {
  try {
    localStorage.setItem('expressHubProgress', JSON.stringify(state.completedItems));
  } catch (e) {
    console.error('Failed to save progress', e);
  }
  updateProgressBar();
  renderSidebar();
}

function markItemComplete(id) {
  if (!state.completedItems.includes(id)) {
    state.completedItems.push(id);
    saveProgress();
  }
}

function updateProgressBar() {
  let totalItems = 0;
  curriculum.forEach((mod) => {
    totalItems += mod.lessons.length;
    if (mod.quiz && mod.quiz.length > 0) totalItems += 1;
  });

  if (totalItems === 0) return;
  const progressPercent = Math.round((state.completedItems.length / totalItems) * 100);

  document.getElementById('progress-bar').style.width = `${progressPercent}%`;
  document.getElementById('progress-text').innerText = `${progressPercent}%`;
}

// --- DOM Elements ---
const DOM = {
  sidebarOverlay: document.getElementById('sidebar-overlay'),
  sidebar: document.getElementById('sidebar'),
  openSidebarBtn: document.getElementById('open-sidebar'),
  closeSidebarBtn: document.getElementById('close-sidebar'),
  moduleList: document.getElementById('module-list'),
  activeModuleTitle: document.getElementById('active-module-title'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  tabLesson: document.getElementById('tab-lesson'),
  tabSimulator: document.getElementById('tab-simulator'),
  tabQuiz: document.getElementById('tab-quiz'),

  codeEditor: document.getElementById('code-editor'),
  runServerBtn: document.getElementById('run-server-btn'),

  apiMethod: document.getElementById('api-method'),
  apiPath: document.getElementById('api-path'),
  sendRequestBtn: document.getElementById('send-request-btn'),
  reqBodyContainer: document.getElementById('request-body-container'),
  apiBody: document.getElementById('api-body'),
  apiResponse: document.getElementById('api-response'),
  responseStatus: document.getElementById('response-status'),
  serverOffOverlay: document.getElementById('server-off-overlay'),

  clearTerminalBtn: document.getElementById('clear-terminal-btn'),
  simulatedTerminal: document.getElementById('simulated-terminal'),
};

// --- Initialization ---
function init() {
  loadProgress();
  updateProgressBar();

  setupEventListeners();

  renderSidebar();
  renderActiveState();
}

function setupEventListeners() {
  // Sidebar toggles
  DOM.openSidebarBtn.addEventListener('click', () => {
    DOM.sidebar.classList.remove('-translate-x-full');
    DOM.sidebarOverlay.classList.remove('hidden');
  });

  const closeSidebar = () => {
    DOM.sidebar.classList.add('-translate-x-full');
    DOM.sidebarOverlay.classList.add('hidden');
  };

  DOM.closeSidebarBtn.addEventListener('click', closeSidebar);
  DOM.sidebarOverlay.addEventListener('click', closeSidebar);

  // Tabs
  DOM.tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // API Client UI
  DOM.apiMethod.addEventListener('change', (e) => {
    if (e.target.value === 'POST') {
      DOM.reqBodyContainer.classList.remove('hidden');
    } else {
      DOM.reqBodyContainer.classList.add('hidden');
    }
  });

  // Simulator Controls
  DOM.runServerBtn.addEventListener('click', toggleServer);
  DOM.sendRequestBtn.addEventListener('click', sendMockRequest);
  DOM.clearTerminalBtn.addEventListener('click', () => {
    DOM.simulatedTerminal.innerHTML = '';
  });

  // Editor formatting
  DOM.codeEditor.addEventListener('keydown', function (e) {
    if (e.key == 'Tab') {
      e.preventDefault();
      var start = this.selectionStart;
      var end = this.selectionEnd;
      this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
      this.selectionStart = this.selectionEnd = start + 2;
    }
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;

  DOM.tabBtns.forEach((btn) => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  DOM.tabContents.forEach((content) => {
    content.classList.remove('active', 'flex', 'lg:flex');
  });

  const activeContent = document.getElementById(`tab-${tabId}`);
  if (tabId === 'simulator') {
    activeContent.classList.add('active', 'flex', 'lg:flex-row');
  } else {
    activeContent.classList.add('active');
  }
}

function getActiveModule() {
  return curriculum.find((m) => m.id === state.activeModuleId) || curriculum[0];
}

function getActiveLesson() {
  const mod = getActiveModule();
  return mod.lessons.find((l) => l.id === state.activeLessonId) || mod.lessons[0];
}

function changeModule(moduleId) {
  const mod = curriculum.find((m) => m.id === moduleId);
  if (mod) {
    state.activeModuleId = moduleId;
    state.activeLessonId = mod.lessons[0].id;

    // Stop server if running
    if (simState.isRunning) toggleServer();

    renderSidebar();
    renderActiveState();
    if (window.innerWidth < 1024) {
      DOM.sidebar.classList.add('-translate-x-full');
      DOM.sidebarOverlay.classList.add('hidden');
    }
  }
}

// --- Rendering Functions ---

function renderSidebar() {
  DOM.moduleList.innerHTML = '';

  curriculum.forEach((mod) => {
    const isActive = mod.id === state.activeModuleId;

    const allLessonsDone = mod.lessons.every((l) => state.completedItems.includes(l.id));
    const quizDone =
      mod.quiz && mod.quiz.length > 0 ? state.completedItems.includes(`${mod.id}-quiz`) : true;
    const isModuleComplete = allLessonsDone && quizDone;

    const li = document.createElement('li');

    const btn = document.createElement('button');
    btn.className = `w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${isActive ? 'bg-gray-200 text-gray-900 font-semibold border-l-4 border-gray-900' : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'}`;
    btn.onclick = () => changeModule(mod.id);

    const textSpan = document.createElement('span');
    textSpan.className = 'truncate block';
    textSpan.innerText = mod.title;

    btn.appendChild(textSpan);

    if (isModuleComplete) {
      const checkIcon = document.createElement('i');
      checkIcon.className = 'fa-solid fa-check-circle text-gray-900';
      btn.appendChild(checkIcon);
    }

    li.appendChild(btn);
    DOM.moduleList.appendChild(li);
  });
}

function renderActiveState() {
  const mod = getActiveModule();
  const lesson = getActiveLesson();

  DOM.activeModuleTitle.innerText = mod.title;

  renderLesson(lesson);
  renderQuiz(mod);

  DOM.codeEditor.value = lesson.defaultCode;

  // Reset API Client UI
  DOM.apiResponse.innerText = '';
  DOM.responseStatus.innerText = 'Waiting...';
  DOM.responseStatus.className = 'text-gray-400 font-mono';
}

function renderLesson(lesson) {
  const isCompleted = state.completedItems.includes(lesson.id);

  // Build objectives HTML
  const objectivesHtml = lesson.objectives && lesson.objectives.length
    ? `
      <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-6 rounded-r-lg">
        <h4 class="font-semibold text-indigo-800 mb-2"><i class="fa-solid fa-bullseye mr-2"></i>Learning Objectives</h4>
        <ul class="list-disc pl-5 text-indigo-700 space-y-1 text-sm">
          ${lesson.objectives.map(o => `<li>${o}</li>`).join('')}
        </ul>
      </div>`
    : '';

  // Build takeaways HTML
  const takeawaysHtml = lesson.takeaways && lesson.takeaways.length
    ? `
      <div class="mt-10 p-5 bg-gray-50 border border-gray-200 rounded-xl">
        <h4 class="font-semibold text-gray-800 mb-3"><i class="fa-solid fa-check-double mr-2 text-green-600"></i>Key Takeaways</h4>
        <ul class="space-y-2">
          ${lesson.takeaways.map(t => `
            <li class="flex items-start gap-2 text-gray-700">
              <i class="fa-solid fa-circle-check text-green-500 mt-1 text-sm"></i>
              <span>${t}</span>
            </li>
          `).join('')}
        </ul>
      </div>`
    : '';

  // Get ELI5 content
  const eli5Html = (window.eli5Toggle && window.eli5ExpressData)
    ? window.eli5ExpressData[lesson.id] || ''
    : '';

  DOM.tabLesson.innerHTML = `
        <div class="max-w-3xl mx-auto animate-fade-in">
            <h2 class="text-3xl font-bold text-gray-900 mb-6">${lesson.title}</h2>
            ${objectivesHtml}
            <div class="prose max-w-none text-gray-800">
                ${window.eli5Toggle ? window.eli5Toggle.wrapContent(lesson.content, eli5Html) : lesson.content}
            </div>
            
            ${takeawaysHtml}
            
            <div class="mt-12 pt-6 border-t border-gray-200 flex justify-between items-center">
                <span class="text-sm text-gray-500"><i class="fa-solid fa-lightbulb mr-1"></i> ${lesson.id}</span>
                <button id="mark-lesson-complete" class="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${isCompleted ? 'bg-gray-200 text-gray-800 cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}">
                    ${isCompleted ? '<i class="fa-solid fa-check"></i> Completed' : 'Mark as Complete & Continue'}
                </button>
            </div>
        </div>
    `;

  /* ELI5 toggle */
  if (window.eli5Toggle) {
    window.eli5Toggle.initToggle('express', DOM.tabLesson);
  }
  const btn = document.getElementById('mark-lesson-complete');
   copyCode.init(DOM.tabLesson);
  if (!isCompleted) {
    btn.addEventListener('click', () => {
      markItemComplete(lesson.id);
      renderLesson(lesson);
      switchTab('simulator');
    });
  }
}

function renderQuiz(mod) {
  const quizId = `${mod.id}-quiz`;
  const isCompleted = state.completedItems.includes(quizId);

  if (!mod.quiz || mod.quiz.length === 0) {
    DOM.tabQuiz.innerHTML =
      '<div class="text-center text-gray-500 mt-10">No quiz available for this module.</div>';
    return;
  }

  let html = `
        <div class="max-w-3xl mx-auto animate-fade-in pb-12">
            <div class="mb-8 border-b pb-4">
                <h2 class="text-3xl font-bold text-gray-900">Module Quiz</h2>
                <p class="text-gray-500 mt-1">${mod.quiz.length} questions — score 100% to pass</p>
                ${isCompleted ? '<span class="inline-block mt-3 bg-gray-200 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold"><i class="fa-solid fa-check mr-1"></i> Passed</span>' : ''}
            </div>
            <div id="quiz-questions-container" class="space-y-8">
    `;

  mod.quiz.forEach((q, index) => {
    html += `
            <div class="bg-white border rounded-xl p-6 shadow-sm" data-question-id="${q.id}">
                <h4 class="font-semibold text-lg text-gray-800 mb-4"><span class="text-blue-600 mr-2">${index + 1}.</span>${q.question}</h4>
                <div class="space-y-3">
        `;

    q.options.forEach((opt, optIdx) => {
      const isSelected = state.quizAnswers[q.id] === optIdx;

      html += `
                <label class="flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50 border-gray-200'}">
                    <input type="radio" name="quiz-${q.id}" value="${optIdx}" class="form-radio text-blue-600 h-5 w-5" ${isSelected ? 'checked' : ''} onchange="handleQuizSelection('${q.id}', ${optIdx})">
                    <span class="ml-3 text-gray-700">${opt}</span>
                </label>
            `;
    });

    html += `</div></div>`;
  });

  html += `
            </div>
            <div class="mt-8 flex flex-col items-center border-t pt-8">
                <button id="submit-quiz-btn" class="px-8 py-3 rounded-lg font-bold text-lg text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all">Submit Answers</button>
                <div id="quiz-feedback" class="mt-4 text-lg font-bold hidden"></div>
            </div>
        </div>
    `;

  DOM.tabQuiz.innerHTML = html;

  document.getElementById('submit-quiz-btn').addEventListener('click', () => {
    let score = 0;
    let allAnswered = true;

    mod.quiz.forEach((q) => {
      if (state.quizAnswers[q.id] === undefined) {
        allAnswered = false;
      } else if (state.quizAnswers[q.id] === q.correct) {
        score++;
      }
    });

    const feedback = document.getElementById('quiz-feedback');
    feedback.classList.remove('hidden', 'text-red-600', 'text-green-600');

    if (!allAnswered) {
      feedback.innerText = 'Please answer all questions.';
      feedback.classList.add('text-red-600');
      return;
    }

    if (score === mod.quiz.length) {
      feedback.innerHTML = '<i class="fa-solid fa-check-circle"></i> Perfect! You passed.';
      feedback.classList.add('text-green-600');
      markItemComplete(quizId);
      renderSidebar();
    } else {
      feedback.innerText = `You scored ${score} out of ${mod.quiz.length}. Try again!`;
      feedback.classList.add('text-red-600');
    }
  });
}

window.handleQuizSelection = function (questionId, optionIndex) {
  state.quizAnswers[questionId] = optionIndex;
  renderQuiz(getActiveModule());
};

// --- Express API Simulator Engine ---

let simState = {
  isRunning: false,
  routes: [],
  middlewares: [],
  originalConsole: {},
};

function printToTerminal(text, type = 'output') {
  const line = document.createElement('div');
  line.className = `terminal-line`;

  let colorClass = 'term-output';
  if (type === 'error') colorClass = 'term-error';
  if (type === 'warn') colorClass = 'term-warn';
  if (type === 'system') colorClass = 'term-system';
  if (type === 'req') colorClass = 'term-req';

  line.innerHTML = `<span class="${colorClass}">${text}</span>`;
  DOM.simulatedTerminal.appendChild(line);
  DOM.simulatedTerminal.scrollTop = DOM.simulatedTerminal.scrollHeight;
}

function formatOutput(args) {
  return Array.from(args)
    .map((arg) => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return '[Object]';
        }
      }
      return String(arg);
    })
    .join(' ');
}

function toggleServer() {
  if (simState.isRunning) {
    simState.isRunning = false;

    if (simState.originalConsole.log) {
      console.log = simState.originalConsole.log;
      console.error = simState.originalConsole.error;
      console.warn = simState.originalConsole.warn;
    }

    DOM.runServerBtn.innerHTML = '<i class="fa-solid fa-play mr-1"></i> Start Server';
    DOM.runServerBtn.className =
      'bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded shadow text-xs font-sans transition-colors font-semibold';
    DOM.serverOffOverlay.classList.remove('hidden');
    DOM.sendRequestBtn.disabled = true;
    printToTerminal('[SYSTEM]: Server stopped.', 'system');
  } else {
    const userCode = DOM.codeEditor.value;
    simState.routes = [];
    simState.middlewares = [];

    simState.originalConsole = { log: console.log, error: console.error, warn: console.warn };
    console.log = (...args) => printToTerminal(formatOutput(args), 'output');
    console.error = (...args) => printToTerminal(formatOutput(args), 'error');
    console.warn = (...args) => printToTerminal(formatOutput(args), 'warn');

    const mockApp = {
      get: (path, handler) => simState.routes.push({ method: 'GET', path, handler }),
      post: (path, handler) => simState.routes.push({ method: 'POST', path, handler }),
      put: (path, handler) => simState.routes.push({ method: 'PUT', path, handler }),
      patch: (path, handler) => simState.routes.push({ method: 'PATCH', path, handler }),
      delete: (path, handler) => simState.routes.push({ method: 'DELETE', path, handler }),
      use: (pathOrMiddleware, middlewareObj) => {
        if (typeof pathOrMiddleware === 'function') {
          simState.middlewares.push({ handler: pathOrMiddleware, path: '*' });
        } else if (typeof middlewareObj === 'function') {
          simState.middlewares.push({ handler: middlewareObj, path: pathOrMiddleware });
        } else if (pathOrMiddleware && pathOrMiddleware.isParser) {
          simState.middlewares.push({ handler: pathOrMiddleware, path: '*' });
        }
      },
      listen: (port, cb) => {
        if (cb) cb();
      },
    };

    const mockExpress = function () {
      return mockApp;
    };
    mockExpress.json = () => {
      const parser = (req, res, next) => next();
      parser.isParser = true;
      return parser;
    };
    mockExpress.urlencoded = () => {
      const parser = (req, res, next) => next();
      parser.isParser = true;
      return parser;
    };
    mockExpress.Router = () => ({
      get: (path, handler) => simState.routes.push({ method: 'GET', path, handler }),
      post: (path, handler) => simState.routes.push({ method: 'POST', path, handler }),
      put: (path, handler) => simState.routes.push({ method: 'PUT', path, handler }),
      patch: (path, handler) => simState.routes.push({ method: 'PATCH', path, handler }),
      delete: (path, handler) => simState.routes.push({ method: 'DELETE', path, handler }),
      use: (fn) => {
        if (typeof fn === 'function') simState.middlewares.push({ handler: fn, path: '*' });
      },
    });
    mockExpress.static = () => {
      const mw = (req, res, next) => next();
      return mw;
    };

    const mockRequire = function (moduleName) {
      if (moduleName === 'express') return mockExpress;
      if (moduleName === 'path') return { join: (...args) => args.join('/') };
      if (moduleName === 'fs') return { readFileSync: () => '' };
      return {};
    };

    try {
      printToTerminal('> node app.js', 'term-prompt');
      const executeNode = new Function('require', 'console', userCode);
      executeNode(mockRequire, console);

      simState.isRunning = true;

      DOM.runServerBtn.innerHTML = '<i class="fa-solid fa-stop mr-1"></i> Stop Server';
      DOM.runServerBtn.className =
        'bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded shadow text-xs font-sans transition-colors font-semibold';
      DOM.serverOffOverlay.classList.add('hidden');
      DOM.sendRequestBtn.disabled = false;
    } catch (e) {
      console.error('Runtime Exception:', e.message);
      console.log = simState.originalConsole.log;
      console.error = simState.originalConsole.error;
      console.warn = simState.originalConsole.warn;
    }
  }
}

function findRoute(method, path, routes) {
  for (const route of routes) {
    if (route.method !== method) continue;

    const routeParts = route.path.split('/');
    const urlParts = path.split('/');

    if (routeParts.length !== urlParts.length) continue;

    const params = {};
    let match = true;

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].slice(1)] = urlParts[i];
      } else if (routeParts[i] !== urlParts[i]) {
        match = false;
        break;
      }
    }

    if (match) return { handler: route.handler, params };
  }
  return null;
}

function sendMockRequest() {
  if (!simState.isRunning) return;

  const method = DOM.apiMethod.value;
  const path = DOM.apiPath.value;
  const bodyStr = DOM.apiBody.value || '{}';

  DOM.responseStatus.innerText = 'Pending...';
  DOM.responseStatus.className = 'text-yellow-500 font-mono font-bold';
  DOM.apiResponse.innerText = '';

  printToTerminal(`\n[REQ]: Client sending ${method} request to ${path}`, 'req');

  let parsedBody = {};
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    try {
      parsedBody = JSON.parse(bodyStr);
    } catch (e) {
      DOM.responseStatus.innerText = '400 Bad Request (Invalid JSON)';
      DOM.responseStatus.className = 'text-red-500 font-mono font-bold';
      DOM.apiResponse.innerText = e.message;
      return;
    }
  }

  const req = {
    method: method,
    url: path,
    body: parsedBody,
    params: {},
    query: Object.fromEntries(new URLSearchParams(path.split('?')[1] || '').entries()),
    headers: { authorization: '', 'content-type': 'application/json' },
    get: function (name) { return this.headers[name.toLowerCase()]; },
  };

  let isResponded = false;
  let statusCode = 200;

  const res = {
    status: function (code) {
      statusCode = code;
      return this;
    },
    json: function (data) {
      if (isResponded) return;
      isResponded = true;
      DOM.responseStatus.innerText = `${statusCode} ${statusCode >= 400 ? 'Error' : 'OK'}`;
      DOM.responseStatus.className =
        statusCode >= 400
          ? 'text-red-500 font-mono font-bold'
          : 'text-green-500 font-mono font-bold';
      DOM.apiResponse.innerText = JSON.stringify(data, null, 2);
    },
    send: function (data) {
      if (isResponded) return;
      isResponded = true;
      DOM.responseStatus.innerText = `${statusCode} OK`;
      DOM.responseStatus.className =
        statusCode >= 400
          ? 'text-red-500 font-mono font-bold'
          : 'text-green-500 font-mono font-bold';
      DOM.apiResponse.innerText = String(data);
    },
    end: function () { isResponded = true; },
  };

  let middlewareIndex = 0;

  function next() {
    if (middlewareIndex < simState.middlewares.length) {
      const mw = simState.middlewares[middlewareIndex++];
      if (mw.path === '*' || mw.path === req.url) {
        if (mw.handler.isParser) {
          next();
        } else {
          try {
            mw.handler(req, res, next);
          } catch (e) {
            console.error('Middleware Error:', e.message);
            res.status(500).send('Internal Server Error');
          }
        }
      } else {
        next();
      }
    } else {
      const cleanPath = path.split('?')[0];
      const matched = findRoute(method, cleanPath, simState.routes);

      if (matched) {
        req.params = matched.params;
        try {
          matched.handler(req, res);
        } catch (e) {
          console.error('Route Handler Error:', e.message);
          if (!isResponded) res.status(500).send('Internal Server Error');
        }
      } else {
        if (!isResponded) res.status(404).send(`Cannot ${method} ${path}`);
      }
    }
  }

  next();
}

// Start application
init();
