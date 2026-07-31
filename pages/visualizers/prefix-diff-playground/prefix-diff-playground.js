(function () {
  'use strict';

  const DEFAULT = [2, 1, 3, 5, 4];
  const $ = (id) => document.getElementById(id);

  const state = {
    mode: 'prefix',
    arr: DEFAULT.slice(),
    prefix: [0],
    buildIndex: 0,
    diff: [],
    reconstructed: [],
  };

  function showError(msg) {
    const el = $('pdp-error');
    if (!msg) {
      el.classList.add('hidden');
      el.textContent = '';
      return;
    }
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function parseInput() {
    const raw = $('pdp-input').value.trim();
    if (!raw) {
      showError('Array is empty. Enter comma-separated numbers.');
      return null;
    }
    const parts = raw.split(/[,\s]+/).filter(Boolean);
    const nums = [];
    for (const p of parts) {
      const n = Number(p);
      if (!Number.isFinite(n)) {
        showError(`Invalid number: "${p}"`);
        return null;
      }
      nums.push(n);
    }
    if (nums.length > 32) {
      showError('Keep array length ≤ 32 for readable visualization.');
      return null;
    }
    showError('');
    return nums;
  }

  function renderCells(container, values, opts = {}) {
    container.innerHTML = '';
    values.forEach((v, i) => {
      const cell = document.createElement('div');
      cell.className = 'pdp-cell';
      if (opts.highlight === i) cell.classList.add('hl');
      if (opts.range && i >= opts.range[0] && i <= opts.range[1]) cell.classList.add('range');
      if (opts.diffMarks) {
        if (opts.diffMarks[i] > 0) cell.classList.add('diff-pos');
        if (opts.diffMarks[i] < 0) cell.classList.add('diff-neg');
      }
      cell.innerHTML = `<span class="idx">${opts.indexOffset ? i : i}</span>${v}`;
      container.appendChild(cell);
    });
  }

  function resetPrefixBuild() {
    state.prefix = [0];
    state.buildIndex = 0;
    renderPrefix();
    $('pdp-query-out').textContent = 'Build the prefix array, then query.';
  }

  function renderPrefix() {
    renderCells($('pdp-arr'), state.arr, {
      highlight: state.buildIndex > 0 && state.buildIndex <= state.arr.length ? state.buildIndex - 1 : -1,
    });
    renderCells($('pdp-pref'), state.prefix, {
      highlight: state.prefix.length - 1,
    });
  }

  function stepBuild() {
    if (state.buildIndex >= state.arr.length) {
      $('pdp-query-out').textContent = 'Prefix complete. Ready for O(1) queries.';
      return;
    }
    const next = state.prefix[state.prefix.length - 1] + state.arr[state.buildIndex];
    state.prefix.push(next);
    state.buildIndex += 1;
    renderPrefix();
    if (state.buildIndex >= state.arr.length) {
      $('pdp-query-out').textContent = 'Prefix complete. Ready for O(1) queries.';
    }
  }

  function buildAll() {
    state.prefix = [0];
    for (let i = 0; i < state.arr.length; i++) {
      state.prefix.push(state.prefix[i] + state.arr[i]);
    }
    state.buildIndex = state.arr.length;
    renderPrefix();
    $('pdp-query-out').textContent = 'Prefix complete. Ready for O(1) queries.';
  }

  function runQuery() {
    if (state.prefix.length !== state.arr.length + 1) {
      $('pdp-query-out').textContent = 'Finish building the prefix array first.';
      return;
    }
    const L = Number($('pdp-L').value);
    const R = Number($('pdp-R').value);
    const n = state.arr.length;
    if (!Number.isInteger(L) || !Number.isInteger(R) || L < 0 || R >= n || L > R) {
      $('pdp-query-out').textContent = `Invalid range. Need 0 ≤ L ≤ R < ${n}.`;
      return;
    }
    const ans = state.prefix[R + 1] - state.prefix[L];
    renderCells($('pdp-arr'), state.arr, { range: [L, R] });
    renderCells($('pdp-pref'), state.prefix, {});
    $('pdp-query-out').textContent = `sum[${L}..${R}] = P[${R + 1}] − P[${L}] = ${state.prefix[R + 1]} − ${state.prefix[L]} = ${ans}`;
  }

  function initDiff() {
    state.diff = state.arr.map((v, i) => (i === 0 ? v : v - state.arr[i - 1]));
    reconstruct();
  }

  function reconstruct() {
    state.reconstructed = [];
    let run = 0;
    for (let i = 0; i < state.diff.length; i++) {
      run += state.diff[i];
      state.reconstructed.push(run);
    }
    renderDiff();
  }

  function renderDiff(marks) {
    renderCells($('pdp-orig'), state.arr);
    renderCells($('pdp-diff'), state.diff, { diffMarks: marks });
    renderCells($('pdp-recon'), state.reconstructed);
  }

  function applyUpdate() {
    const L = Number($('pdp-dL').value);
    const R = Number($('pdp-dR').value);
    const X = Number($('pdp-dX').value);
    const n = state.arr.length;
    if (!Number.isInteger(L) || !Number.isInteger(R) || L < 0 || R >= n || L > R || !Number.isFinite(X)) {
      $('pdp-diff-out').textContent = `Invalid update. Need 0 ≤ L ≤ R < ${n} and numeric X.`;
      return;
    }
    state.diff[L] += X;
    if (R + 1 < n) state.diff[R + 1] -= X;
    const marks = {};
    marks[L] = X;
    if (R + 1 < n) marks[R + 1] = -X;
    reconstruct();
    renderDiff(marks);
    $('pdp-diff-out').textContent = `D[${L}] += ${X}` + (R + 1 < n ? `; D[${R + 1}] -= ${X}` : '') + '. Reconstructed via prefix of D.';
  }

  function applyArray(nums) {
    state.arr = nums.slice();
    $('pdp-input').value = nums.join(', ');
    resetPrefixBuild();
    initDiff();
    $('pdp-L').max = nums.length - 1;
    $('pdp-R').max = nums.length - 1;
    $('pdp-dL').max = nums.length - 1;
    $('pdp-dR').max = nums.length - 1;
  }

  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('.pdp-mode').forEach((btn) => {
      const on = btn.dataset.mode === mode;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', String(on));
    });
    $('pdp-prefix-panel').classList.toggle('hidden', mode !== 'prefix');
    $('pdp-diff-panel').classList.toggle('hidden', mode !== 'diff');
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyArray(DEFAULT);

    document.querySelectorAll('.pdp-mode').forEach((btn) => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    $('pdp-apply').addEventListener('click', () => {
      const nums = parseInput();
      if (nums) applyArray(nums);
    });

    $('pdp-random').addEventListener('click', () => {
      const len = 5 + Math.floor(Math.random() * 5);
      const nums = Array.from({ length: len }, () => Math.floor(Math.random() * 9) + 1);
      applyArray(nums);
      showError('');
    });

    $('pdp-reset').addEventListener('click', () => applyArray(DEFAULT));
    $('pdp-step').addEventListener('click', stepBuild);
    $('pdp-build').addEventListener('click', buildAll);
    $('pdp-query').addEventListener('click', runQuery);
    $('pdp-update').addEventListener('click', applyUpdate);

    $('pdp-theme').addEventListener('click', () => {
      const root = document.documentElement;
      const light = root.classList.toggle('light-mode');
      try {
        localStorage.setItem('theme', light ? 'light' : 'dark');
      } catch (e) {}
      const icon = $('pdp-theme').querySelector('i');
      icon.className = light ? 'fas fa-sun' : 'fas fa-moon';
    });

    const icon = $('pdp-theme').querySelector('i');
    icon.className = document.documentElement.classList.contains('light-mode') ? 'fas fa-sun' : 'fas fa-moon';
  });
})();
