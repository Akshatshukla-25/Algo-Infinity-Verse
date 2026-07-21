(function () {
  'use strict';

  const DRAFT_KEY = 'aiv_loop_invariant_draft';

  const EXAMPLES = {
    'binary-search': {
      invariant: 'Target is in arr[lo..hi] if it exists anywhere in the array.',
      checks: '0 <= lo\nlo <= hi\nhi < n',
    },
    'insertion-sort': {
      invariant: 'arr[0..i-1] is sorted (sorted prefix grows).',
      checks: '0 <= i\ni <= n\nsortedPrefix == i',
    },
    'two-pointers': {
      invariant: 'If a pair summing to target exists, it lies between indices i and j inclusive.',
      checks: '0 <= i\ni <= j\nj < n',
    },
  };

  const $ = (id) => document.getElementById(id);

  let sim = null;
  let playId = null;

  function parseChecks(text) {
    return text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  }

  function evalCheck(expr, ctx) {
    const m = expr.match(/^([a-zA-Z_]+)\s*(<=|>=|<|>|==)\s*(-?\d+|[a-zA-Z_]+)$/);
    if (!m) return { ok: false, reason: `Cannot parse check: ${expr}` };
    const left = resolve(m[1], ctx);
    const op = m[2];
    const right = resolve(m[3], ctx);
    if (left === undefined || right === undefined) {
      return { ok: false, reason: `Unknown identifier in: ${expr}` };
    }
    let ok = false;
    if (op === '<=') ok = left <= right;
    else if (op === '>=') ok = left >= right;
    else if (op === '<') ok = left < right;
    else if (op === '>') ok = left > right;
    else if (op === '==') ok = left === right;
    return { ok, reason: ok ? `${expr} holds (${left} ${op} ${right})` : `${expr} broken (${left} ${op} ${right})` };
  }

  function resolve(token, ctx) {
    if (/^-?\d+$/.test(token)) return Number(token);
    return ctx[token];
  }

  function evaluateInvariant(ctx) {
    const checks = parseChecks($('lil-checks').value);
    if (!checks.length) {
      return {
        holds: true,
        messages: ['No formal checks — treat plain-English invariant as a mental model only.'],
      };
    }
    const messages = [];
    let holds = true;
    checks.forEach((c) => {
      const r = evalCheck(c, ctx);
      messages.push(r.reason);
      if (!r.ok) holds = false;
    });
    return { holds, messages };
  }

  function createBinarySearch() {
    const arr = [1, 3, 5, 7, 9, 11, 15, 18, 21];
    const target = 15;
    return {
      name: 'binary-search',
      arr,
      target,
      lo: 0,
      hi: arr.length - 1,
      mid: null,
      done: false,
      found: false,
      step() {
        if (this.done) return 'finished';
        if (this.lo > this.hi) {
          this.done = true;
          this.mid = null;
          return 'not-found';
        }
        this.mid = Math.floor((this.lo + this.hi) / 2);
        if (this.arr[this.mid] === this.target) {
          this.done = true;
          this.found = true;
          return 'found';
        }
        if (this.arr[this.mid] < this.target) this.lo = this.mid + 1;
        else this.hi = this.mid - 1;
        return 'continue';
      },
      ctx() {
        return {
          lo: this.lo,
          hi: this.hi,
          mid: this.mid == null ? -1 : this.mid,
          n: this.arr.length,
          target: this.target,
          i: 0,
          j: 0,
          sortedPrefix: 0,
        };
      },
    };
  }

  function createInsertionSort() {
    const arr = [5, 2, 4, 6, 1, 3];
    return {
      name: 'insertion-sort',
      arr,
      i: 1,
      j: 1,
      key: arr[1],
      phase: 'pick',
      done: false,
      step() {
        if (this.done) return 'finished';
        if (this.phase === 'pick') {
          if (this.i >= this.arr.length) {
            this.done = true;
            return 'sorted';
          }
          this.key = this.arr[this.i];
          this.j = this.i - 1;
          this.phase = 'shift';
          return 'picked-key';
        }
        if (this.j >= 0 && this.arr[this.j] > this.key) {
          this.arr[this.j + 1] = this.arr[this.j];
          this.j -= 1;
          return 'shift';
        }
        this.arr[this.j + 1] = this.key;
        this.i += 1;
        this.phase = 'pick';
        return 'insert';
      },
      ctx() {
        return {
          lo: 0,
          hi: this.arr.length - 1,
          mid: -1,
          n: this.arr.length,
          target: this.key,
          i: this.i,
          j: Math.max(0, this.j),
          sortedPrefix: Math.min(this.i, this.arr.length),
        };
      },
    };
  }

  function createTwoPointers() {
    const arr = [1, 2, 3, 4, 6, 8, 9];
    const target = 10;
    return {
      name: 'two-pointers',
      arr,
      target,
      i: 0,
      j: arr.length - 1,
      done: false,
      found: false,
      step() {
        if (this.done) return 'finished';
        if (this.i >= this.j) {
          this.done = true;
          return 'not-found';
        }
        const sum = this.arr[this.i] + this.arr[this.j];
        if (sum === this.target) {
          this.done = true;
          this.found = true;
          return 'found';
        }
        if (sum < this.target) this.i += 1;
        else this.j -= 1;
        return 'continue';
      },
      ctx() {
        return {
          lo: this.i,
          hi: this.j,
          mid: -1,
          n: this.arr.length,
          target: this.target,
          i: this.i,
          j: this.j,
          sortedPrefix: this.arr.length,
        };
      },
    };
  }

  function createSim(kind) {
    if (kind === 'insertion-sort') return createInsertionSort();
    if (kind === 'two-pointers') return createTwoPointers();
    return createBinarySearch();
  }

  function render() {
    const ctx = sim.ctx();
    const root = $('lil-array');
    root.innerHTML = '';
    sim.arr.forEach((v, idx) => {
      const cell = document.createElement('div');
      cell.className = 'lil-cell';
      cell.textContent = v;
      if (sim.name === 'binary-search') {
        if (idx === sim.lo) cell.classList.add('lo');
        if (idx === sim.hi) cell.classList.add('hi');
        if (idx === sim.mid) cell.classList.add('mid');
      } else if (sim.name === 'insertion-sort') {
        if (idx < sim.i) cell.classList.add('sorted');
        if (idx === sim.i) cell.classList.add('i');
        if (idx === sim.j) cell.classList.add('j');
      } else {
        if (idx === sim.i) cell.classList.add('i');
        if (idx === sim.j) cell.classList.add('j');
      }
      root.appendChild(cell);
    });

    $('lil-vars').textContent = Object.entries(ctx)
      .map(([k, v]) => `${k} = ${v}`)
      .join('  ·  ');

    const result = evaluateInvariant(ctx);
    const status = $('lil-status');
    status.className = `lil-status ${result.holds ? 'holds' : 'breaks'}`;
    status.textContent = result.holds ? 'Invariant HOLDS' : 'Invariant BROKEN';
    $('lil-explain').textContent = `${$('lil-invariant').value.trim() || '(no plain-English invariant)'} — ${result.messages.join('; ')}`;
  }

  function saveDraft() {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          algo: $('lil-algo').value,
          invariant: $('lil-invariant').value,
          checks: $('lil-checks').value,
        })
      );
    } catch (e) {}
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.algo) $('lil-algo').value = d.algo;
      if (d.invariant) $('lil-invariant').value = d.invariant;
      if (d.checks) $('lil-checks').value = d.checks;
    } catch (e) {}
  }

  function reset() {
    stopPlay();
    sim = createSim($('lil-algo').value);
    render();
  }

  function step() {
    if (!sim) reset();
    sim.step();
    render();
    if (sim.done) stopPlay();
  }

  function stopPlay() {
    if (playId) {
      clearInterval(playId);
      playId = null;
    }
    $('lil-play').innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> Play';
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadDraft();
    reset();

    $('lil-algo').addEventListener('change', () => {
      const ex = EXAMPLES[$('lil-algo').value];
      if (ex && !$('lil-invariant').value.trim()) {
        $('lil-invariant').value = ex.invariant;
        $('lil-checks').value = ex.checks;
      }
      reset();
      saveDraft();
    });

    $('lil-invariant').addEventListener('input', () => {
      saveDraft();
      render();
    });
    $('lil-checks').addEventListener('input', () => {
      saveDraft();
      render();
    });

    $('lil-example').addEventListener('click', () => {
      const ex = EXAMPLES[$('lil-algo').value];
      $('lil-invariant').value = ex.invariant;
      $('lil-checks').value = ex.checks;
      saveDraft();
      reset();
    });

    $('lil-reset').addEventListener('click', reset);
    $('lil-step').addEventListener('click', step);
    $('lil-play').addEventListener('click', () => {
      if (playId) {
        stopPlay();
        return;
      }
      if (sim && sim.done) reset();
      $('lil-play').innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i> Pause';
      playId = setInterval(step, 700);
    });
  });
})();
