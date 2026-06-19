import vm from "vm";

function safeStringify(value) {
  try {
    if (value === undefined) return "undefined";
    return JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
  } catch {
    try {
      return String(value);
    } catch {
      return "[Unserializable]";
    }
  }
}

function deepEqualMvp(a, b) {
  // MVP strategy:
  // 1) Try JSON deep comparison
  // 2) Fall back to strict equality
  const sa = safeStringify(a);
  const sb = safeStringify(b);
  if (sa === sb) return true;
  return Object.is(a, b);
}

function normalizeError(err) {
  if (!err) return { message: "Unknown error", stack: null, name: null, lineNumber: null };
  return {
    name: err.name || null,
    message: err.message || String(err),
    stack: err.stack || null,
    lineNumber: err.lineNumber ?? null,
  };
}

function wrapForTimeout(fn, timeoutMs) {
  // Returns a function that resolves/rejects with a timeout.
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(Object.assign(new Error(`Time limit exceeded (${timeoutMs}ms)`), { code: "ETIMEOUT" }));
    }, timeoutMs);

    Promise.resolve()
      .then(() => fn())
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

export async function executeJavaScriptSandbox({
  userCode,
  exportName,
  tests,
  debug = false,
  timeLimitMsPerTest = 750,
  maxOutputBytes = 20000,
}) {
  if (typeof userCode !== "string" || !userCode.trim()) {
    throw new Error("userCode must be a non-empty string");
  }
  if (typeof exportName !== "string" || !exportName.trim()) {
    throw new Error("exportName must be a non-empty string");
  }
  if (!Array.isArray(tests)) {
    throw new Error("tests must be an array");
  }

  const logs = [];
  const stdout = {
    write: (chunk) => {
      if (chunk === undefined) return;
      logs.push(String(chunk));
    },
  };

  const context = {
    console: {
      log: (...args) => {
        const line = args
          .map((a) => {
            if (typeof a === "bigint") return a.toString();
            if (typeof a === "string") return a;
            return safeStringify(a);
          })
          .join(" ");
        logs.push(line);
      },
      error: (...args) => {
        const line = args
          .map((a) => {
            if (typeof a === "bigint") return a.toString();
            if (typeof a === "string") return a;
            return safeStringify(a);
          })
          .join(" ");
        logs.push(line);
      },
    },
    // Prevent access to obvious host APIs
    setTimeout: undefined,
    setInterval: undefined,
    clearTimeout: undefined,
    clearInterval: undefined,
    // Allow basic JS globals (vm provides intrinsics)
    Math,
    Date,
    Number,
    String,
    Boolean,
    Array,
    Object,
    JSON,
    RegExp,
    Promise,
  };

  const sandbox = vm.createContext(context, {
    name: "aiv-js-sandbox",
  });

  // Compile user code once
  const wrappedCode = `"use strict";\n${userCode}\n`;

  // Basic output limit for logs
  function truncateLogsIfNeeded() {
    if (logs.length === 0) return;
    let bytes = 0;
    const kept = [];
    for (const line of logs) {
      bytes += Buffer.byteLength(line, "utf8");
      if (bytes > maxOutputBytes) break;
      kept.push(line);
    }
    logs.length = 0;
    logs.push(...kept);
  }

  let solveFn;
  try {
    const script = new vm.Script(wrappedCode, {
      filename: "user-code.js",
      displayErrors: true,
    });
    script.runInContext(sandbox, { timeout: timeLimitMsPerTest });

    // export resolution (MVP)
    // Supported options:
    // - function declared globally with name == exportName
    // - const/let function assigned to exportName
    // - module.exports assignment is NOT supported in this MVP
    solveFn = sandbox[exportName];
  } catch (err) {
    throw {
      type: "RuntimeError",
      error: normalizeError(err),
      stdout: debug ? logs.join("\n") : undefined,
    };
  }

  if (typeof solveFn !== "function") {
    throw {
      type: "BadExport",
      error: {
        message: `Export '${exportName}' not found or is not a function.`,
        lineNumber: null,
      },
      stdout: debug ? logs.join("\n") : undefined,
    };
  }

  const results = [];

  for (const test of tests) {
    const name = test?.name || "sample";
    const input = test?.input;
    const expected = test?.expected;

    try {
      truncateLogsIfNeeded();

      const actual = await wrapForTimeout(() => {
        // Call convention:
        // - if input is an array: solveFn(...input)
        // - else: solveFn(input)
        if (Array.isArray(input)) return solveFn(...input);
        return solveFn(input);
      }, timeLimitMsPerTest);

      const pass = deepEqualMvp(actual, expected);

      results.push({
        name,
        pass,
        expected,
        actual,
        error: null,
        stdout: debug ? logs.join("\n") : undefined,
      });
    } catch (err) {
      const normalized = normalizeError(err);
      results.push({
        name,
        pass: false,
        expected,
        actual: null,
        error: normalized,
        stdout: debug ? logs.join("\n") : undefined,
      });
    }

    // Reset logs between tests so “which test failed” is clearer
    logs.length = 0;
  }

  return {
    exportName,
    timeLimitMsPerTest,
    tests: results,
  };
}

