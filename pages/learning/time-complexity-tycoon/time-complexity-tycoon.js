import { simulateStep } from '../../../modules/time-complexity-tycoon.js';

const $ = (id) => document.getElementById(id);

const STATE = {
  level: 1,
  scenarioIndex: 0,
  score: 0,
  streak: 0,
  serverLoad: 18,
  n: 0,
  requestRate: 0,
  cacheHitRate: 0,
  selectedOption: null,
  bestScore: 0,
  busy: false,
  gameOver: false,
};

function parseUser() {
  // user may be stored in window.userProgress or fetched via /api/session by existing app.
  return window.userProgress || {};
}

function getLevelConfig(level) {
  // Increase workload over levels.
  const n = 60 + level * 30;
  const requestRate = 0.6 + Math.min(1.8, level * 0.22);
  const cacheHitRate = clamp01(0.12 + level * 0.04);
  return { n, requestRate, cacheHitRate };
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function scenarioPoolForRequestType(type) {
  // Options map: techniqueName + complexityLabel + memoryFactor.
  // memoryFactor influences memoryMB in the simulation.
  if (type === 'Searching') {
    return [
      {
        id: 'linear_scan',
        techniqueName: 'Linear scan',
        complexityLabel: 'O(n)',
        memoryFactor: 0.02,
      },
      {
        id: 'binary_search_sorted',
        techniqueName: 'Binary search (sorted array)',
        complexityLabel: 'O(log n)',
        memoryFactor: 0.005,
      },
      {
        id: 'hash_index',
        techniqueName: 'Hash index lookup',
        complexityLabel: 'O(1)',
        memoryFactor: 0.035,
      },
      {
        id: 'nested_find',
        techniqueName: 'Brute force compare',
        complexityLabel: 'O(n²)',
        memoryFactor: 0.02,
      },
    ];
  }

  if (type === 'Sorting') {
    return [
      {
        id: 'insertion_sort',
        techniqueName: 'Insertion sort',
        complexityLabel: 'O(n²)',
        memoryFactor: 0.01,
      },
      {
        id: 'merge_sort',
        techniqueName: 'Merge sort',
        complexityLabel: 'O(n log n)',
        memoryFactor: 0.05,
      },
      {
        id: 'quick_sort_avg',
        techniqueName: 'Quick sort (average)',
        complexityLabel: 'O(n log n)',
        memoryFactor: 0.03,
      },
      {
        id: 'bucket_idea',
        techniqueName: 'Bucket approach (limited range)',
        complexityLabel: 'O(n)',
        memoryFactor: 0.04,
      },
    ];
  }

  if (type === 'Data Retrieval') {
    return [
      {
        id: 'recompute',
        techniqueName: 'Recompute results each query',
        complexityLabel: 'O(n²)',
        memoryFactor: 0.02,
      },
      {
        id: 'memo_cache',
        techniqueName: 'Memoization + cache',
        complexityLabel: 'O(n)',
        memoryFactor: 0.08,
      },
      {
        id: 'index_cache',
        techniqueName: 'Index + cache hit',
        complexityLabel: 'O(1)',
        memoryFactor: 0.06,
      },
      {
        id: 'sort_each_time',
        techniqueName: 'Sort then fetch',
        complexityLabel: 'O(n log n)',
        memoryFactor: 0.05,
      },
    ];
  }

  // Default: array processing.
  return [
    {
      id: 'hash',
      techniqueName: 'Hash map aggregation',
      complexityLabel: 'O(n)',
      memoryFactor: 0.07,
    },
    {
      id: 'tree',
      techniqueName: 'Balanced tree indexing',
      complexityLabel: 'O(n log n)',
      memoryFactor: 0.045,
    },
    {
      id: 'bad',
      techniqueName: 'Repeated nested scans',
      complexityLabel: 'O(n²)',
      memoryFactor: 0.02,
    },
    {
      id: 'fast',
      techniqueName: 'Precomputed lookup',
      complexityLabel: 'O(1)',
      memoryFactor: 0.04,
    },
  ];
}

function pickScenarioForLevel(level) {
  const types = ['Searching', 'Sorting', 'Data Retrieval'];
  // Rotate deterministically for stable feel.
  const type = types[(STATE.scenarioIndex + level) % types.length];
  const { n, requestRate, cacheHitRate } = getLevelConfig(level);
  return {
    type,
    n: Math.floor(n * (0.95 + (STATE.scenarioIndex % 3) * 0.04)),
    requestRate: Number(requestRate.toFixed(2)),
    cacheHitRate: Number(cacheHitRate.toFixed(2)),
    note:
      type === 'Searching'
        ? 'High-throughput queries: pick a lookup strategy that scales with n.'
        : type === 'Sorting'
          ? 'Many items arriving: optimize the ordering step to protect latency.'
          : 'Repeated reads: caching/indexing can dramatically reduce repeated work.',
    options: scenarioPoolForRequestType(type),
  };
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function setProgressUI({ cpuPercent, memoryMB, responseTimeMs, nextServerLoad }) {
  const cpuFill = $('tcCpuFill');
  const memFill = $('tcMemFill');
  const rtFill = $('tcRtFill');
  const loadFill = $('tcLoadFill');

  $('tcCpuVal').textContent = `${Math.round(cpuPercent)}%`;
  cpuFill.style.width = `${Math.round(cpuPercent)}%`;

  $('tcMemVal').textContent = `${Math.round(memoryMB)} MB`;
  memFill.style.width = `${Math.round((memoryMB / 2048) * 100)}%`;

  $('tcRtVal').textContent = `${Math.round(responseTimeMs)} ms`;
  rtFill.style.width = `${Math.round((responseTimeMs / 5000) * 100)}%`;

  $('tcLoadVal').textContent = `${Math.round(nextServerLoad)}`;
  loadFill.style.width = `${Math.round(nextServerLoad)}%`;
}

function setFeedback({ scoreDelta, educational }) {
  const el = $('tcFeedback');
  const ok = scoreDelta >= 0;

  const deltaClass = ok ? 'ok' : 'bad';
  const sign = ok ? '+' : '';

  el.innerHTML = `
    <div class="delta ${deltaClass}">${sign}${scoreDelta} pts</div>
    <div class="small">
      <div><b>Selected:</b> ${educational.techniqueName} (${educational.timeComplexity})</div>
      ${educational.mistake ? `<div style="margin-top:6px; color: rgba(255,77,109,.95); font-weight:800;">${educational.mistake}</div>` : ''}
      ${educational.correct ? `<div style="margin-top:6px; color: rgba(46,229,157,.95); font-weight:800;">${educational.correct}</div>` : ''}
    </div>
  `;

  $('tcComplexityExplain').innerHTML = `
    <div class="tc-educator-title">Time Complexity Insight</div>
    <div class="tc-educator-body">
      <b>Big-O:</b> ${educational.timeComplexity}. ${educational.explanation}
    </div>
  `;
}

function setScenarioUI(s) {
  $('tcReqType').textContent = s.type;
  $('tcN').textContent = s.n;
  $('tcRate').textContent = `${s.requestRate.toFixed(2)}`;
  $('tcCache').textContent = `${Math.round(s.cacheHitRate * 100)}%`;
  $('tcScenarioNote').textContent = s.note;

  const optionsEl = $('tcOptions');
  const options = shuffle(s.options).slice(0, 4);

  optionsEl.innerHTML = options
    .map((opt) => {
      const tag = opt.complexityLabel;
      return `
        <button class="option-btn" data-option-id="${opt.id}">
          ${opt.techniqueName}
          <span class="sub">Expected complexity: <b>${tag}</b></span>
          <span class="tag"><i>↗</i> Scales with n</span>
        </button>
      `;
    })
    .join('');

  // Bind
  [...optionsEl.querySelectorAll('button.option-btn')].forEach((btn) => {
    btn.addEventListener('click', () => onPickOption(btn, options, s));
  });
}

function lockOptions() {
  [...$('tcOptions').querySelectorAll('button.option-btn')].forEach((b) => (b.disabled = true));
}

async function persistBestScoreIfNeeded() {
  // Backend route: /api/time-complexity-tycoon/best (to be added)
  if (!window.fetch) return;
  if (!STATE.bestScore || STATE.score <= STATE.bestScore) return;

  STATE.bestScore = STATE.score;

  try {
    const res = await fetch('/api/time-complexity-tycoon/best', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bestScore: STATE.bestScore, levelReached: STATE.level }),
    });
    if (res.ok) {
      $('tcBestScore').textContent = STATE.bestScore;
    }
  } catch {
    // ignore persistence failures
  }
}

async function loadBestScore() {
  try {
    const res = await fetch('/api/time-complexity-tycoon/best', { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      STATE.bestScore = data?.bestScore || 0;
      $('tcBestScore').textContent = STATE.bestScore;
    }
  } catch {
    // ignore
  }
}

function onPickOption(btn, options, scenario) {
  if (STATE.busy || STATE.gameOver) return;
  STATE.busy = true;

  const opt = options.find((o) => o.id === btn.dataset.optionId);
  if (!opt) {
    STATE.busy = false;
    return;
  }

  STATE.selectedOption = opt;
  lockOptions();

  // Simulate
  const result = simulateStep({
    n: scenario.n,
    requestRate: scenario.requestRate,
    cacheHitRate: scenario.cacheHitRate,
    currentServerLoad: STATE.serverLoad,
    option: opt,
  });

  STATE.serverLoad = result.nextServerLoad;
  STATE.score += result.scoreDelta;

  if (result.scoreDelta >= 0) STATE.streak += 1;
  else STATE.streak = 0;

  $('tcScore').textContent = STATE.score;
  $('tcStreak').textContent = STATE.streak;

  setProgressUI(result);
  setFeedback(result);

  $('tcNextBtn').disabled = false;
  $('tcNextBtn').focus();

  // Persist best in background
  void persistBestScoreIfNeeded();

  STATE.busy = false;
}

function nextScenario() {
  $('tcNextBtn').disabled = true;
  STATE.scenarioIndex += 1;

  const totalScenariosPerLevel = 3;
  if (STATE.scenarioIndex > totalScenariosPerLevel) {
    STATE.scenarioIndex = 0;
    STATE.level += 1;
    $('tcLevel').textContent = STATE.level;
  }

  if (STATE.level > 8) {
    endGame();
    return;
  }

  const s = pickScenarioForLevel(STATE.level);
  STATE.n = s.n;
  STATE.requestRate = s.requestRate;
  STATE.cacheHitRate = s.cacheHitRate;

  setFeedback({
    scoreDelta: 0,
    educational: { techniqueName: '', timeComplexity: '', explanation: '' },
  });
  setScenarioUI(s);

  // Reset bars a bit to reduce jumpiness
  setProgressUI({
    cpuPercent: 20,
    memoryMB: 160,
    responseTimeMs: 140,
    nextServerLoad: STATE.serverLoad,
  });

  $('tcFeedback').innerHTML = '';
}

function endGame() {
  STATE.gameOver = true;
  $('tcNextBtn').disabled = true;
  $('tcOptions').innerHTML = '';

  $('tcFeedback').innerHTML = `
    <div class="delta ok">🏆 Run complete</div>
    <div class="small">
      Final score: <b>${STATE.score}</b><br/>
      Best score is persisted when you improve it.
    </div>
  `;

  // Persist best
  void persistBestScoreIfNeeded();
}

function restart() {
  STATE.level = 1;
  STATE.scenarioIndex = 0;
  STATE.score = 0;
  STATE.streak = 0;
  STATE.serverLoad = 18;
  STATE.selectedOption = null;
  STATE.busy = false;
  STATE.gameOver = false;

  $('tcLevel').textContent = STATE.level;
  $('tcScore').textContent = STATE.score;
  $('tcStreak').textContent = STATE.streak;

  const s = pickScenarioForLevel(STATE.level);
  $('tcFeedback').innerHTML = '';
  setProgressUI({
    cpuPercent: 20,
    memoryMB: 160,
    responseTimeMs: 140,
    nextServerLoad: STATE.serverLoad,
  });
  setScenarioUI(s);
  $('tcNextBtn').disabled = true;
}

function bindUI() {
  $('tcNextBtn').addEventListener('click', () => nextScenario());
  $('tcRestartBtn').addEventListener('click', () => restart());
}

async function init() {
  const user = parseUser();
  $('tcUserPill').textContent = user?.name ? `Player: ${user.name}` : 'Logged in';

  bindUI();
  await loadBestScore();
  restart();
}

init();
