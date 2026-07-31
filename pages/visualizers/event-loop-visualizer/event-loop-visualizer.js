/* event-loop-visualizer.js
 * Interactive JavaScript Event Loop, Microtask & Macrotask Visualizer
 * (Issue #2072)
 *
 * Architecture:
 *   - Runtime() — Call Stack, Web APIs, Microtask Queue, Macrotask Queue,
 *     Event Loop coordinator.
 *   - Parser — translates a strict JS-async subset into an instruction
 *     list. We do not execute user-supplied code (it would require running
 *     real JS); we interpret a tiny DSL that mirrors the API shape enough
 *     that the visualizer teaches the same scheduling behaviour as
 *     running code in Node or a browser.
 *
 * Supported subset:
 *   - console.log("msg" [, ...])
 *   - setTimeout(label, ms)
 *   - setInterval("label", ms, count?) — plays `count` ticks, default 4
 *   - queueMicrotask("label")
 *   - requestAnimationFrame("label")
 *   - async function _name() { ... }
 *   - await _task("label")     — schedules a continuation as a microtask
 *   - Promise.resolve("label") — schedules .then continuation as microtask
 *
 * The interpreter runs in ticks: each tick advances the Event Loop by
 * one scheduling decision (run a callback, move a timer from Web APIs
 * to a queue, restart the loop). Speed is configurable via the slider.
 */
(() => {
  // ───── Embedded default examples ─────
  const EXAMPLES = {
    intro: `// Classic: why does the Promise run before setTimeout?
console.log("1: sync start");
setTimeout("macrotask", 0);
Promise.resolve("then-after-promise").then("console-log:6");
console.log("2: sync end");`,
    await: `// async/await awaits always resume on the microtask queue
async function run() {
  console.log("A1: enter run()");
  await asyncStep("A2: after await");
  console.log("A3: resume");
}
console.log("B: before run()");
run();
console.log("C: after run() (sync)");`,
    nested: `// Nested microtasks drain the entire microtask queue before macrotasks
console.log("start");
Promise.resolve("after-promise-1").then("console-log:micro-1");
queueMicrotask("queue-micro-2");
setTimeout("macrotask", 0);
Promise.resolve("after-promise-2").then("console-log:micro-3");`,
    raf: `// requestAnimationFrame callbacks fire before the next macrotask
console.log("raf demo");
requestAnimationFrame("callback-raf");
setTimeout("callback-timer", 0);
console.log("sync end");`,
    interval: `// setInterval fires repeatedly per scheduled tick (here: 3 ticks)
setInterval("interval-tick", 50, 3);
console.log("interval scheduled");`,
    custom: '',
  };

  // ───── Parser ─────
  // Walks the source line by line and emits an instruction list. We treat
  // unsupported syntax as a comment so writing free-form text never crashes
  // the simulator — the user sees a log line and execution continues.
  function parseProgram(source) {
    const instructions = [];
    const lines = source.split(/\r?\n/).map((l, i) => ({ raw: l, num: i + 1, text: l.trim() }));

    // Track async functions to model their body as a sequence that
    // pauses at each `await`, resuming as a microtask.
    let i = 0;
    while (i < lines.length) {
      const { text, num } = lines[i];

      if (!text || text.startsWith('//') || text.startsWith('/*')) {
        i += 1;
        continue;
      }

      // eslint-disable-next-line no-inner-declarations
      function emitConsoleLine(label) {
        instructions.push({
          kind: 'console',
          line: num,
          message: label,
        });
      }

      // eslint-disable-next-line no-inner-declarations
      function emitSetTimeout() {
        // setTimeout("label", ms)
        const m = text.match(
          /^setTimeout\(\s*"((?:[^"\\]|\\.)*)"\s*,\s*(-?\d+(?:\.\d+)?)\s*\)\s*;?$/
        );
        if (m) {
          instructions.push({
            kind: 'setTimeout',
            line: num,
            label: m[1],
            ms: Number(m[2]),
          });
          i += 1;
          return true;
        }
        return false;
      }
      // Try high-priority forms first; each returns true if it consumed the line.
      if (emitSetTimeout()) continue;

      // setInterval("label", ms, count?)
      let m = text.match(
        /^setInterval\(\s*"((?:[^"\\]|\\.)*)"\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*,\s*(-?\d+))?\s*\)\s*;?$/
      );
      if (m) {
        instructions.push({
          kind: 'setInterval',
          line: num,
          label: m[1],
          ms: Number(m[2]),
          count: m[3] == null ? Infinity : Number(m[3]),
        });
        i += 1;
        continue;
      }

      // queueMicrotask("label")
      m = text.match(/^queueMicrotask\(\s*"((?:[^"\\]|\\.)*)"\s*\)\s*;?$/);
      if (m) {
        instructions.push({
          kind: 'queueMicrotask',
          line: num,
          label: m[1],
        });
        i += 1;
        continue;
      }

      // requestAnimationFrame("label")
      m = text.match(/^requestAnimationFrame\(\s*"((?:[^"\\]|\\.)*)"\s*\)\s*;?$/);
      if (m) {
        instructions.push({
          kind: 'requestAnimationFrame',
          line: num,
          label: m[1],
        });
        i += 1;
        continue;
      }

      // Promise.resolve("then-id").then("consequent-id")
      m = text.match(
        /^Promise\.resolve\(\s*"((?:[^"\\]|\\.)*)"\s*\)\.then\(\s*"((?:[^"\\]|\\.)*)"\s*\)\s*;?$/
      );
      if (m) {
        instructions.push({
          kind: 'promiseThen',
          line: num,
          source: m[1],
          consequent: m[2],
        });
        i += 1;
        continue;
      }

      // await asyncStep("label")
      m = text.match(/^await\s+asyncStep\(\s*"((?:[^"\\]|\\.)*)"\s*\)\s*;?$/);
      if (m) {
        instructions.push({
          kind: 'awaitAsyncStep',
          line: num,
          label: m[1],
        });
        i += 1;
        continue;
      }

      // console.log("msg" [, fulfilment])
      m = text.match(/^console\.log\(\s*"((?:[^"\\]|\\.)*)"\s*(?:,\s*(.+))?\s*\)\s*;?$/);
      if (m) {
        emitConsoleLine(m[1]);
        i += 1;
        continue;
      }

      // console.log("msg:code") looking up the result of an earlier step
      m = text.match(/^console\.log:\s*"((?:[^"\\]|\\.)*)"\s*;?$/);
      if (m) {
        // Lightly normalise the bespoke console-log:<id> form used in the
        // examples; the runtime resolves the label by treating messages
        // with a leading "m" or "A" so this stays a noop during parsing.
        emitConsoleLine(m[1]);
        i += 1;
        continue;
      }

      // async function _name() {
      const af = text.match(/^async\s+function\s+(\w+)\s*\(\s*\)\s*\{\s*$/);
      if (af) {
        const name = af[1];
        const bodyLines = [];
        let depth = 1;
        i += 1;
        while (i < lines.length && depth > 0) {
          const line = lines[i].text;
          if (line) {
            for (const ch of line) {
              if (ch === '{') depth += 1;
              if (ch === '}') depth -= 1;
            }
            if (depth > 0) bodyLines.push(lines[i]);
          }
          i += 1;
        }
        instructions.push({
          kind: 'asyncFunction',
          line: num,
          name,
          body: bodyLines.map((l) => l.text),
        });
        // After the async function declaration, schedule its call (later in
        // the source) by adding an inline note so the interpreter recognizes
        // `run()` as an invocation. The user can call it via:
        //   <asyncFnName>();
        // captured by the next clause.
        continue;
      }

      // _name();   — invoke a function (sync or async)
      m = text.match(/^(\w+)\s*\(\s*\)\s*;?$/);
      if (m) {
        instructions.push({ kind: 'call', line: num, name: m[1] });
        i += 1;
        continue;
      }

      // Token-literals like "console-log:6" used in `then` continuations
      // (examples contain these). They parse as a console line identifier.
      m = text.match(/^"((?:[^"\\]|\\.)*)";?$/);
      if (m) {
        // Bare string literal; ignore.
        i += 1;
        continue;
      }

      // Anything else: treat as opaque and skip with a log warning.
      instructions.push({ kind: 'unknown', line: num, text });
      i += 1;
    }

    return instructions;
  }

  // ───── Runtime ─────
  class Runtime {
    constructor() {
      this.callStack = []; // string[] — names of running frames
      this.webApis = []; // {id,label,remainingMs,totalMs,kind}
      this.microQueue = []; // {id,label,kind}
      this.macroQueue = []; // {id,label,kind}
      this.tickCount = 0;
      this.simTimeMs = 0;
      this.tasksRun = 0;
      this.lastHighlightId = null;
      this.eventLog = [];
      this.nextTaskId = 1;
    }

    log(action, text) {
      this.eventLog.push({ action, text });
    }

    pushStack(label) {
      this.callStack.push(label);
    }

    popStack() {
      return this.callStack.pop();
    }

    scheduleWebTimer(label, ms) {
      const id = this.nextTaskId++;
      this.webApis.push({
        id,
        label,
        kind: 'timer',
        remainingMs: Math.max(0, ms),
        totalMs: ms,
      });
      return id;
    }

    scheduleIntervalTick(interval) {
      // Re-arm the interval timer for the same duration.
      this.webApis.push({
        id: this.nextTaskId++,
        label: interval.label,
        kind: 'timer',
        remainingMs: interval.ms,
        totalMs: interval.ms,
        isInterval: true,
        intervalRef: interval,
      });
    }

    enqueueMicrotask(label, kind = 'microtask') {
      const id = this.nextTaskId++;
      this.microQueue.push({ id, label, kind });
      return id;
    }

    enqueueMacrotask(label, kind = 'macrotask') {
      const id = this.nextTaskId++;
      this.macroQueue.push({ id, label, kind });
      return id;
    }

    /**
     * Advance simulated time by `ms` and move any expired Web API timers
     * into the appropriate queue. macrotasks come from setTimeout /
     * setInterval / DOM events; microtasks come from queued microtasks
     * accumulated during synchronous execution.
     */
    advance(ms) {
      this.simTimeMs += ms;
      const stillRunning = [];
      for (const t of this.webApis) {
        t.remainingMs -= ms;
        if (t.remainingMs <= 0) {
          if (t.isInterval && t.intervalRef && t.intervalRef.remaining > 0) {
            t.intervalRef.remaining -= 1;
            this.enqueueMacrotask(t.label, 'interval-tick');
            // Re-arm if budget remains.
            if (t.intervalRef.remaining > 0) {
              this.scheduleIntervalTick(t.intervalRef);
            }
          } else {
            this.enqueueMacrotask(t.label, t.isInterval ? 'interval-tick' : 'timer');
          }
        } else {
          stillRunning.push(t);
        }
      }
      this.webApis = stillRunning;
    }

    /**
     * Drives one step of the event loop.
     *   1. Drain the microtask queue, executing each microtask body.
     *   2. If microtasks scheduled further microtasks during their run,
     *      keep draining until empty.
     *   3. If the script is still executing (cursor < instructions.length
     *      or pending continuation sync code), drive it.
     *   4. Advance simulated time to expire any timers, populating the
     *      macroQueue if a timer just hit zero.
     *   5. Pop one macrotask from the macroQueue and execute.
     * Returns true if execution can continue, false if run finished.
     */
    step(program) {
      this.tickCount += 1;

      // 1. Drain microtasks first — microtasks always run before the next
      //    macrotask. Within microtask draining we also pull continuation
      //    sync code out of `asyncContinuations` if the label matches.
      while (this.microQueue.length > 0) {
        const micro = this.microQueue.shift();
        this.pushStack(micro.label);
        const continuationBody = program.takeContinuation(micro.label);
        if (continuationBody) {
          // Continuation labels run their post-await body synchronously
          // and may schedule more microtasks along the way (e.g. another
          // await inside). The `isRunning` flag keeps the program cursor
          // advancing until the continuation is exhausted, then yields.
          const newInstr = parseProgram(continuationBody.join('\n'));
          program.instructionsForContinuation(micro.label, newInstr);
          program.advanceOne();
          while (program.isActive()) {
            const res = program.advanceOne();
            if (res.done) break;
            if (res.kind === 'yield') break;
            if (program.cursor >= program.instructions.length) break;
          }
          this.log('micro', `async continuation "${micro.label}" resumed`);
        } else {
          program.execConsole(this.resolveLabel(micro.label));
          this.log('micro', `microtask "${micro.label}" ran`);
        }
        this.popStack();
        this.tasksRun += 1;
        if (this.microQueue.length === 0 && !program.hasMoreSyncWork()) {
          break;
        }
      }

      // 2. Drive the synchronous instruction list while it has more work.
      while (program.hasMoreSyncWork()) {
        const advanceRes = program.advanceOne();
        if (advanceRes.done) {
          program.finish();
          break;
        }
        if (advanceRes.kind === 'yield') break;
      }

      // 2b. After any synchronous execution runs (which may register more
      //     microtasks), drain them again. Real engines guarantee ALL
      //     currently-pending microtasks drain before any macrotask runs.
      while (this.microQueue.length > 0) {
        const micro = this.microQueue.shift();
        this.pushStack(micro.label);
        const continuationBody = program.takeContinuation(micro.label);
        if (continuationBody) {
          const newInstr = parseProgram(continuationBody.join('\n'));
          program.instructionsForContinuation(micro.label, newInstr);
          while (program.hasMoreSyncWork()) {
            const r = program.advanceOne();
            if (r.done || r.kind === 'yield') break;
          }
          if (!program.finished && program.cursor >= program.instructions.length) {
            if (program.asyncContinuations.size === 1) {
              program.asyncContinuations.clear();
            }
          }
          this.log('micro', `async continuation "${micro.label}" resumed`);
        } else {
          program.execConsole(this.resolveLabel(micro.label));
          this.log('micro', `microtask "${micro.label}" ran`);
        }
        this.popStack();
        this.tasksRun += 1;
      }

      // 3. Advance simulated time to expire any timers. Only do this if no
      //    microtasks are pending — the event loop must drain ALL pending
      //    microtasks before any macrotask runs.
      if (this.webApis.length > 0 && this.microQueue.length === 0) {
        const next = this.webApis.reduce((a, b) => (a.remainingMs < b.remainingMs ? a : b));
        if (this.macroQueue.length === 0) {
          this.advance(Math.max(1, next.remainingMs));
        }
      } else if (
        this.simTimeMs === 0 &&
        this.microQueue.length === 0 &&
        this.macroQueue.length === 0
      ) {
        this.advance(1);
      }

      // 4. Pop one macrotask if available.
      if (this.macroQueue.length > 0) {
        const macro = this.macroQueue.shift();
        this.pushStack(macro.label);
        program.execConsole(this.resolveLabel(macro.label));
        this.log('macro', `macrotask "${macro.label}" ran`);
        this.popStack();
        this.tasksRun += 1;
        return true;
      }

      // 5. Done?
      if (
        this.webApis.length === 0 &&
        this.callStack.length === 0 &&
        !program.hasMoreSyncWork() &&
        this.microQueue.length === 0
      ) {
        this.log('system', 'all tasks drained — run complete');
        program.finish();
        return false;
      }
      return true;
    }

    resolveLabel(label) {
      // Conventions used in the built-in examples:
      //   "console-log:6" → console.log(...)
      //   "macrotask" / "timer" / "raf" → bare label
      if (/^console-log(:.*)?$/.test(label.trim())) return label;
      return label;
    }
  }

  // ───── Program ─────
  // Drives the synchronous interpretation of the parsed instruction list.
  // We split the runtime into two phases:
  //   - "running" phase: execution is happening synchronously; the event
  //     loop should NOT pop anything else until this phase finishes.
  //   - "idle" phase: microtasks and macrotasks can run.
  class Program {
    constructor(instructions, runtime) {
      this.instructions = instructions;
      this.runtime = runtime;
      this.cursor = 0;
      this.asyncContinuations = new Map(); // fn name → remaining body lines
      this.asyncFrameCount = 0;
      this.finished = false;
      this.pendingConsole = [];
    }

    isActive() {
      return this.finished ? false : this.cursor < this.instructions.length;
    }

    hasMoreSyncWork() {
      return this.finished ? false : this.cursor < this.instructions.length;
    }

    finish() {
      this.finished = true;
    }

    takeContinuation(label) {
      return this.asyncContinuations.get(label) || null;
    }

    instructionsForContinuation(label, newInstructions) {
      // Insert any synchronous remnant from the continuation at the cursor
      // so the next advanceOne() picks it up.
      if (newInstructions.length === 0) return;
      this.instructions.splice(this.cursor, 0, ...newInstructions);
    }

    /**
     * Returns {done:boolean, kind?:string} where kind describes what just
     * happened for the UI to render.
     */
    advanceOne() {
      if (this.cursor >= this.instructions.length) {
        if (this.asyncContinuations.size > 0) {
          // Yield: resume orchestration for async bodies.
          return { done: false, kind: 'yield' };
        }
        this.finish();
        return { done: true };
      }

      const instr = this.instructions[this.cursor];
      this.cursor += 1;

      switch (instr.kind) {
        case 'console': {
          this.runtime.pushStack(`script:line ${instr.line}`);
          this.runtime.log('console', `console.log("${instr.message}")`);
          this.runtime.tasksRun += 1;
          this.runtime.popStack();
          return { done: false, kind: 'console' };
        }
        case 'setTimeout': {
          this.runtime.pushStack(`script:line ${instr.line}`);
          this.runtime.scheduleWebTimer(instr.label, instr.ms);
          this.runtime.log('client', `setTimeout("${instr.label}", ${instr.ms}ms) registered`);
          this.runtime.popStack();
          return { done: false, kind: 'setTimeout' };
        }
        case 'setInterval': {
          this.runtime.pushStack(`script:line ${instr.line}`);
          const interval = {
            label: instr.label,
            ms: instr.ms,
            remaining: Number.isFinite(instr.count) ? instr.count : Infinity,
          };
          // Stash on a registry the runtime can find.
          this.runtime._intervals = this.runtime._intervals || new Map();
          this.runtime.scheduleIntervalTick(interval);
          this.runtime._intervals.set(`ref${this.runtime.tasksRun}`, interval);
          this.runtime.log(
            'client',
            `setInterval("${instr.label}", ${instr.ms}ms, count=${interval.remaining}) registered`
          );
          this.runtime.popStack();
          return { done: false, kind: 'setInterval' };
        }
        case 'queueMicrotask': {
          this.runtime.pushStack(`script:line ${instr.line}`);
          this.runtime.enqueueMicrotask(instr.label);
          this.runtime.log('client', `queueMicrotask("${instr.label}") scheduled`);
          this.runtime.popStack();
          return { done: false, kind: 'queueMicrotask' };
        }
        case 'requestAnimationFrame': {
          this.runtime.pushStack(`script:line ${instr.line}`);
          this.runtime.scheduleWebTimer(`raf:${instr.label}`, 16);
          this.runtime.log('client', `requestAnimationFrame("${instr.label}") registered`);
          this.runtime.popStack();
          return { done: false, kind: 'requestAnimationFrame' };
        }
        case 'promiseThen': {
          this.runtime.pushStack(`script:line ${instr.line}`);
          this.runtime.enqueueMicrotask(instr.consequent, 'promise');
          this.runtime.log('client', `Promise.then queued microtask "${instr.consequent}"`);
          this.runtime.popStack();
          return { done: false, kind: 'promiseThen' };
        }
        case 'awaitAsyncStep': {
          this.runtime.pushStack(`script:line ${instr.line}`);
          this.runtime.enqueueMicrotask(instr.label, 'await');
          this.runtime.log('client', `await → enqueued microtask "${instr.label}"`);
          this.runtime.popStack();
          return { done: false, kind: 'await' };
        }
        case 'asyncFunction': {
          // Save body for later invocation; sub-shells out at call.
          this.asyncContinuations.set(instr.name, instr.body);
          this.runtime.log(
            'system',
            `async function ${instr.name}() defined (${instr.body.length} body line${instr.body.length === 1 ? '' : 's'})`
          );
          return { done: false, kind: 'asyncFunction' };
        }
        case 'call': {
          const body = this.asyncContinuations.get(instr.name);
          if (body) {
            // Run the async body until first await, then schedule a
            // microtask continuation for the post-await code.
            this.runtime.pushStack(`${instr.name}() invocation`);
            this.runtime.log('call', `${instr.name}() invoked`);
            this._scheduleAsyncBody(instr.name, body);
            this.runtime.asyncFrameCount += 1;
            this.runtime.popStack();
            return { done: false, kind: 'call' };
          }
          this.runtime.log('system', `unknown call: ${instr.name}()`);
          return { done: false, kind: 'call' };
        }
        case 'unknown': {
          this.runtime.log('skip', `unrecognised line: "${instr.text}"`);
          return { done: false, kind: 'unknown' };
        }
        default:
          return { done: false, kind: 'noop' };
      }
    }

    /**
     * Walks the async body up to the first `await`, executing sync parts
     * inline. The remainder is registered as a microtask continuation that
     * drains itself when microtasks are next polled.
     */
    _scheduleAsyncBody(name, body) {
      const slicedBody = body.slice();
      // Run until first `await` (or end).
      const syncPart = [];
      const asyncPart = [];
      let inAwait = false;
      for (const ln of slicedBody) {
        if (!inAwait && !/await\s+/.test(ln)) {
          syncPart.push(ln);
        } else {
          inAwait = true;
          asyncPart.push(ln);
        }
      }
      // Now execute the syncPart recursively by re-feeding Program.
      const newInstr = parseProgram(syncPart.join('\n'));
      this.instructions.splice(this.cursor, 0, ...newInstr);

      // Register the post-await code as a microtask continuation body.
      this.asyncContinuations.set(`${name}__continuation_${this.asyncFrameCount}`, asyncPart);
      // Schedule a microtask that will run the post-await portion when
      // the queue is next drained.
      this.runtime.enqueueMicrotask(
        `${name}__continuation_${this.asyncFrameCount}`,
        'async-resume'
      );
    }

    execConsole(label) {
      // Hook the runtime can call to put a console line up. The plain
      // ol' runtime exec doesn't need a "script: line X" frame because
      // it has run from a callback already.
      if (!label) return;
      this.runtime.log('console', `>> ${label}`);
      this.runtime.tasksRun += 1;
    }
  }

  // ───── UI ─────
  function initUI() {
    const $ = (id) => document.getElementById(id);
    const state = {
      runtime: new Runtime(),
      program: null,
      speed: 450,
      tickHandle: null,
      playing: false,
      lastHeading: '',
    };

    function renderRuntime() {
      // Push arrays into the DOM.
      function renderBucket(listId, items, klass) {
        const el = $(listId);
        el.innerHTML = '';
        if (items.length === 0) {
          const note = document.createElement('li');
          note.className = 'empty-bucket-note';
          note.textContent = 'empty';
          el.appendChild(note);
          return;
        }
        for (const item of items.slice().reverse()) {
          const li = document.createElement('li');
          li.className = klass;
          if (typeof item === 'string') {
            // Call Stack frame — string label only.
            li.textContent = item;
          } else {
            // Timer or task object.
            const text = item.label;
            const meta =
              item.remainingMs != null
                ? `${Math.max(0, item.remainingMs).toFixed(0)}ms left`
                : item.kind === 'timer' ||
                    item.kind === 'interval-tick' ||
                    item.kind === 'raf' ||
                    item.kind === 'promise' ||
                    item.kind === 'microtask' ||
                    item.kind === 'macrotask' ||
                    item.kind === 'await' ||
                    item.kind === 'async-resume'
                  ? item.kind
                  : 'task';
            const label = document.createElement('span');
            label.textContent = text;
            const meta2 = document.createElement('span');
            meta2.style.opacity = '0.75';
            meta2.style.marginLeft = '8px';
            meta2.style.fontSize = '0.7rem';
            meta2.textContent = meta;
            li.appendChild(label);
            li.appendChild(meta2);
          }
          el.appendChild(li);
        }
      }
      renderBucket('callStack', state.runtime.callStack, 'frame');
      renderBucket('webApis', state.runtime.webApis, 'timer');
      renderBucket('microtaskQueue', state.runtime.microQueue, 'task micro');
      renderBucket('macrotaskQueue', state.runtime.macroQueue, 'task macro');
      $('tickCount').textContent = String(state.runtime.tickCount);
      $('simTime').textContent = Math.round(state.runtime.simTimeMs);
      $('visitCount').textContent = String(state.runtime.tasksRun);
    }

    function renderLog() {
      const ol = $('log');
      ol.innerHTML = '';
      for (let i = 0; i < state.runtime.eventLog.length; i += 1) {
        const entry = state.runtime.eventLog[i];
        const li = document.createElement('li');
        li.className = entry.action;
        li.textContent = `${entry.action.padEnd(7)} | ${entry.text}`;
        ol.appendChild(li);
      }
      ol.scrollTop = ol.scrollHeight;
    }

    function renderBadge() {
      $('runtime-state').textContent = state.playing
        ? 'Running'
        : state.runtime.eventLog.length === 0
          ? 'Idle'
          : 'Paused';
      $('eventLoopCard').classList.toggle('running', state.playing);
      $('eventLoopCard').classList.toggle('idle', !state.playing);
      $('eventLoopStatus').textContent = state.playing ? 'ticking — looking for tasks…' : 'idle';
    }

    function explainForLast() {
      const last = state.runtime.eventLog.at(-1);
      if (!last) return;
      let msg = last.text;
      let heading = last.action;
      switch (last.action) {
        case 'console':
          heading = 'Synchronous execution';
          msg =
            'console.log runs on the Call Stack with no scheduling. The result is logged immediately and execution continues.';
          break;
        case 'client':
          heading = 'Browser API registered';
          msg =
            'setTimeout, setInterval and friends leave the JS heap and run in the browser (or Node) Web APIs layer. JS keeps going synchronously.';
          break;
        case 'micro':
          heading = 'Microtask drained';
          msg =
            'After the synchronous script finished, the Event Loop drained the microtask queue (Promises, queueMicrotask, await continuations) before touching macrotasks.';
          break;
        case 'macro':
          heading = 'Macrotask popped';
          msg =
            'With the microtask queue empty AND no synchronous code running, the Event Loop took the oldest task off the macrotask queue and ran it.';
          break;
        case 'call':
          heading = 'Async function invoked';
          msg =
            'async functions run synchronously until their first await. After that they suspend and enqueue a microtask to resume.';
          break;
        case 'system':
          heading = 'System signal';
          break;
        case 'skip':
          heading = 'Unrecognised line skipped';
          msg =
            'This line of source did not match any supported async API. It was ignored so the rest of your program still runs.';
          break;
        default:
          heading = 'Tick';
      }
      if (state.lastHeading !== heading) {
        $('explainText').textContent = msg;
        state.lastHeading = heading;
      }
      $('explainCard').querySelector('h4').innerHTML =
        `<i class="fas fa-circle-info"></i> ${heading}`;
    }

    function refreshAll() {
      renderRuntime();
      renderLog();
      renderBadge();
      explainForLast();
    }

    function reset() {
      if (state.tickHandle) {
        clearInterval(state.tickHandle);
        state.tickHandle = null;
      }
      state.playing = false;
      state.runtime = new Runtime();
      const src = $('codeInput').value;
      const instructions = parseProgram(src);
      state.program = new Program(instructions, state.runtime);
      state.lastHeading = '';
      $('log').innerHTML = '';
      $('explainText').textContent =
        'Press Run to start simulation, Step to walk forward one tick at a time.';
      $('explainCard').querySelector('h4').innerHTML =
        `<i class="fas fa-circle-info"></i> What's happening here?`;
      refreshAll();
    }

    function setupExampleSelect() {
      $('exampleSelect').addEventListener('change', () => {
        const key = $('exampleSelect').value;
        $('codeInput').value = EXAMPLES[key] ?? '';
        reset();
      });
      $('codeInput').value = EXAMPLES.intro;
    }

    function tickOnce() {
      const more = state.runtime.step(state.program);
      refreshAll();
      if (!more) {
        state.playing = false;
        if (state.tickHandle) {
          clearInterval(state.tickHandle);
          state.tickHandle = null;
        }
        refreshAll();
      }
    }

    function bindControls() {
      $('btnRun').addEventListener('click', () => {
        if (!state.program) reset();
        if (state.playing) return;
        state.playing = true;
        if (state.tickHandle) clearInterval(state.tickHandle);
        state.tickHandle = setInterval(tickOnce, state.speed);
        refreshAll();
      });
      $('btnStep').addEventListener('click', () => {
        if (!state.program) reset();
        // Pause any current playback.
        if (state.tickHandle) {
          clearInterval(state.tickHandle);
          state.tickHandle = null;
        }
        state.playing = false;
        tickOnce();
      });
      $('btnPause').addEventListener('click', () => {
        if (state.tickHandle) {
          clearInterval(state.tickHandle);
          state.tickHandle = null;
        }
        state.playing = false;
        refreshAll();
      });
      $('btnReset').addEventListener('click', () => {
        reset();
      });
      $('btnClearLog').addEventListener('click', () => {
        state.runtime.eventLog.length = 0;
        $('log').innerHTML = '';
        state.lastHeading = '';
        refreshAll();
      });
      $('speedRange').addEventListener('input', (e) => {
        state.speed = Number(e.target.value);
        $('speedValue').textContent = `${state.speed} ms / step`;
        if (state.playing && state.tickHandle) {
          clearInterval(state.tickHandle);
          state.tickHandle = setInterval(tickOnce, state.speed);
        }
      });
    }

    setupExampleSelect();
    bindControls();
    reset();
  }

  // Wait for DOM ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }

  // Expose for unit testing / exploration.
  if (typeof window !== 'undefined') {
    window.__EventLoopSimulator__ = { Runtime, Program, parseProgram, EXAMPLES };
  }
})();
