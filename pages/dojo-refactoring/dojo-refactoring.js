const ORIGINAL_CODE = `
function solve(arr) {
  // Intentionally unoptimized and verbose implementation
  if (arr == null) {
    return [];
  } else {
    if (!Array.isArray(arr)) {
      return [];
    } else {
      let i = 0;
      while (i < arr.length) {
        i++;
      }

      let out = [];
      for (let j = arr.length - 1; j >= 0; j--) {
        if (arr[j] === undefined) {
          out.push(undefined);
        } else {
          out.push(arr[j]);
        }
      }

      // redundant branch
      if (out.length === 0) {
        return [];
      } else {
        return out;
      }
    }
  }
}
`;

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"')
    .replaceAll("'", '&#039;');
}

function safePretty(v) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

const DEFAULT_TESTS = [
  { name: 'reverse-1', input: [[1, 2, 3]], expectedOutput: [3, 2, 1] },
  { name: 'reverse-2', input: [['a', 'b']], expectedOutput: ['b', 'a'] },
  { name: 'reverse-3', input: [[0]], expectedOutput: [0] },
];

function setStatus(text) {
  const el = $('statusText');
  if (el) el.textContent = text;
}

function renderTests(tests) {
  const list = $('testsList');
  if (!list) return;
  list.innerHTML = '';

  for (const t of tests) {
    const row = document.createElement('div');
    row.className = `test-row ${t.pass ? 'pass' : 'fail'}`;

    const expectedStr = t.expected === undefined ? 'undefined' : safePretty(t.expected);
    const actualStr = t.actual === undefined ? 'undefined' : safePretty(t.actual);

    row.innerHTML = `
      <div><b>${escapeHtml(t.name)}</b> ${t.pass ? '✅' : '❌'}</div>
      ${
        t.pass
          ? ''
          : `
        <div class="diff">
          <div><b>Expected:</b> <code>${escapeHtml(expectedStr)}</code></div>
          <div><b>Actual:</b> <code>${escapeHtml(actualStr)}</code></div>
          ${t.runtimeError ? `<div style="margin-top:6px"><b>Runtime:</b> <pre>${escapeHtml(safePretty(t.runtimeError))}</pre></div>` : ''}
        </div>
      `
      }
    `;

    list.appendChild(row);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  $('originalCode').value = ORIGINAL_CODE;
  $('refactoredCode').value = ORIGINAL_CODE;

  $('runAndAnalyze')?.addEventListener('click', async () => {
    const status = $('statusText');
    if (status) status.textContent = 'Running tests & analyzing...';

    const payload = {
      originalCode: $('originalCode').value,
      refactoredCode: $('refactoredCode').value,
      tests: DEFAULT_TESTS,
    };

    try {
      const resp = await fetch('/api/refactoring-dojo/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (!resp.ok || data?.error) {
        $('runtimeError').style.display = 'block';
        $('runtimeError').textContent = data?.error || 'Request failed';
        setStatus('Failed.');
        return;
      }

      const { score, passed, total, metrics, improvementStats, suggestions } = data;

      $('behaviorSummary').textContent = `Passed ${passed}/${total} tests.`;
      renderTests(data.tests || []);

      $('metricsOriginal').textContent = safePretty(metrics.original);
      $('metricsRefactored').textContent = safePretty(metrics.refactored);
      $('improvementStats').textContent = safePretty(improvementStats);

      const badge = $('scoreBadge');
      if (badge) badge.textContent = String(score);

      const hint = $('scoreHint');
      if (hint) {
        hint.textContent =
          score >= 80
            ? 'Great refactor!'
            : score >= 55
              ? 'Decent improvements!'
              : 'Needs more work.';
      }

      const ul = $('suggestionsList');
      if (ul) {
        ul.innerHTML = '';
        for (const s of suggestions || []) {
          const li = document.createElement('li');
          li.textContent = s;
          ul.appendChild(li);
        }
      }

      setStatus('Done.');
    } catch (e) {
      $('runtimeError').style.display = 'block';
      $('runtimeError').textContent = e?.message || String(e);
      setStatus('Failed.');
    }
  });
});
