// tests/eventLoopVisualizerParser.test.js
//
// Smoke-tests the source parser and runtime state-machine exposed by the
// Event Loop visualizer (Issue #2072). Validates the DSL recogniser for
// each supported async API plus a few interesting edge cases.

import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadEngine() {
  const file = path.join(
    __dirname,
    '..',
    'pages',
    'visualizers',
    'event-loop-visualizer',
    'event-loop-visualizer.js'
  );
  const src = fs.readFileSync(file, 'utf8');
  const sandbox = {
    window: {},
    document: { readyState: 'loading', addEventListener: () => {} },
    console,
    setInterval: () => 0,
    setTimeout: () => 0,
    clearInterval: () => {},
    clearTimeout: () => {},
  };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: file });
  return sandbox.window.__EventLoopSimulator__;
}

describe('event-loop-visualizer parser (Issue #2072)', () => {
  let engine;

  beforeAll(async () => {
    engine = await loadEngine();
  });

  describe('parseProgram', () => {
    it('returns an empty list for an empty program', () => {
      const out = engine.parseProgram('');
      expect(out).toEqual([]);
    });
  });

  describe('console.log', () => {
    it('expects strings as argument', () => {
      const out = engine.parseProgram('console.log("hi");');
      expect(out).toHaveLength(1);
      expect(out[0]).toMatchObject({ kind: 'console', message: 'hi' });
    });

    it('skips blank lines and comments', () => {
      const out = engine.parseProgram('// hi\n\nconsole.log("a");\n/* block */\nconsole.log("b");');
      const consoleOnly = out.filter((i) => i.kind === 'console');
      expect(consoleOnly).toHaveLength(2);
      expect(consoleOnly.map((c) => c.message)).toEqual(['a', 'b']);
    });

    it('emits "unknown" for an unrecognised line', () => {
      const out = engine.parseProgram('doSomething(123);');
      expect(out).toHaveLength(1);
      expect(out[0].kind).toBe('unknown');
    });
  });

  describe('setTimeout', () => {
    it('parses setTimeout("label", 200)', () => {
      const out = engine.parseProgram('setTimeout("go", 200);');
      expect(out).toHaveLength(1);
      expect(out[0]).toMatchObject({ kind: 'setTimeout', label: 'go', ms: 200 });
    });

    it('parses setInterval("label", 50, 3)', () => {
      const out = engine.parseProgram('setInterval("tick", 50, 3);');
      expect(out).toHaveLength(1);
      expect(out[0]).toMatchObject({
        kind: 'setInterval',
        label: 'tick',
        ms: 50,
        count: 3,
      });
    });
  });

  describe('queueMicrotask', () => {
    it('parses queueMicrotask("label")', () => {
      const out = engine.parseProgram('queueMicrotask("payload");');
      expect(out[0]).toMatchObject({ kind: 'queueMicrotask', label: 'payload' });
    });
  });

  describe('requestAnimationFrame', () => {
    it('parses requestAnimationFrame("label")', () => {
      const out = engine.parseProgram('requestAnimationFrame("frame");');
      expect(out[0]).toMatchObject({ kind: 'requestAnimationFrame', label: 'frame' });
    });
  });

  describe('Promise.then', () => {
    it('parses Promise.resolve("…").then("…")', () => {
      const out = engine.parseProgram('Promise.resolve("p").then("c");');
      expect(out[0]).toMatchObject({
        kind: 'promiseThen',
        source: 'p',
        consequent: 'c',
      });
    });
  });

  describe('async / await', () => {
    it('parses an async function declaration and emits a top-level call', () => {
      const src = [
        'async function run() {',
        '  console.log("inside");',
        '  await asyncStep("step");',
        '  console.log("after");',
        '}',
        'run();',
      ].join('\n');
      const out = engine.parseProgram(src);
      // Expect one asyncFunction entry plus the call entry.
      const fns = out.filter((i) => i.kind === 'asyncFunction');
      const calls = out.filter((i) => i.kind === 'call');
      expect(fns).toHaveLength(1);
      expect(fns[0].name).toBe('run');
      expect(fns[0].body).toEqual([
        'console.log("inside");',
        'await asyncStep("step");',
        'console.log("after");',
      ]);
      expect(calls[0]).toMatchObject({ kind: 'call', name: 'run' });
    });

    it('parses a top-level await step', () => {
      const out = engine.parseProgram('await asyncStep("go");');
      expect(out[0]).toMatchObject({ kind: 'awaitAsyncStep', label: 'go' });
    });
  });
});

function isRuntimeDrained(rt, program) {
  return (
    program.finished &&
    rt.callStack.length === 0 &&
    rt.webApis.length === 0 &&
    rt.microQueue.length === 0 &&
    rt.macroQueue.length === 0
  );
}

describe('event-loop-visualizer runtime (Issue #2072)', () => {
  let engine;
  beforeAll(async () => {
    engine = await loadEngine();
  });

  it('runs the simple example end-to-end (Promise then runs before setTimeout)', () => {
    const src = engine.EXAMPLES.intro;
    const instr = engine.parseProgram(src);
    const rt = new engine.Runtime();
    const program = new engine.Program(instr, rt);

    let guard = 0;
    while (!isRuntimeDrained(rt, program) && guard < 5000) {
      rt.step(program);
      guard += 1;
    }

    const thenIdx = rt.eventLog.findIndex((e) => e.text && e.text.includes('console-log:6'));
    const macroIdx = rt.eventLog.findIndex((e) => e.action === 'macro');
    expect(thenIdx).toBeGreaterThan(-1);
    expect(macroIdx).toBeGreaterThan(-1);
    expect(thenIdx).toBeLessThan(macroIdx);
    expect(guard).toBeLessThan(5000);
  });

  it('drains all microtasks before a macrotask', () => {
    const src = engine.EXAMPLES.nested;
    const instr = engine.parseProgram(src);
    const rt = new engine.Runtime();
    const program = new engine.Program(instr, rt);
    let guard = 0;
    while (!isRuntimeDrained(rt, program) && guard < 10000) {
      rt.step(program);
      guard += 1;
    }
    // The microtasks should run before any macrotask finishes.
    const actions = rt.eventLog.map((e) => e.action);
    let firstMacro = -1;
    let firstMicro = -1;
    for (let i = 0; i < actions.length; i += 1) {
      if (actions[i] === 'macro' && firstMacro === -1) firstMacro = i;
      if (actions[i] === 'micro' && firstMicro === -1) firstMicro = i;
    }
    if (firstMacro !== -1) {
      expect(firstMicro).toBeGreaterThan(-1);
      expect(firstMicro).toBeLessThan(firstMacro);
    }
  });

  it('honours a finite setInterval countdown (no more ticks than count)', () => {
    const src = engine.EXAMPLES.interval;
    const instr = engine.parseProgram(src);
    const rt = new engine.Runtime();
    const program = new engine.Program(instr, rt);
    let guard = 0;
    while (!isRuntimeDrained(rt, program) && guard < 10000) {
      rt.step(program);
      guard += 1;
    }
    const intervalMacros = rt.eventLog.filter(
      (e) => e.action === 'macro' && /interval-tick/i.test(e.text)
    );
    expect(intervalMacros.length).toBeLessThanOrEqual(3);
    expect(intervalMacros.length).toBeGreaterThan(0);
  });

  it('initialises a fresh Runtime with empty buckets and zeroed counters', () => {
    const rt = new engine.Runtime();
    expect(rt.callStack).toEqual([]);
    expect(rt.webApis).toEqual([]);
    expect(rt.microQueue).toEqual([]);
    expect(rt.macroQueue).toEqual([]);
    expect(rt.tickCount).toBe(0);
    expect(rt.simTimeMs).toBe(0);
    expect(rt.tasksRun).toBe(0);
  });

  it('the Step example awaits correctly across async/await microtasks', () => {
    const src = engine.EXAMPLES.await;
    const instr = engine.parseProgram(src);
    const rt = new engine.Runtime();
    const program = new engine.Program(instr, rt);
    let guard = 0;
    while (!isRuntimeDrained(rt, program) && guard < 10000) {
      rt.step(program);
      guard += 1;
    }
    const events = rt.eventLog.map((e) => `${e.action}|${e.text}`).join('\n');
    expect(events).toContain('run() invoked');
    expect(events).toMatch(/enter run\(\)/);
    expect(guard).toBeLessThan(10000);
  });
});
