(function () {
  'use strict';

  const CACHE_KEY = 'aiv_coding_heatmap_cache_v1';
  const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

  const state = {
    byDate: {},
    enabled: { github: true, leetcode: true, codeforces: true },
  };

  const $ = (id) => document.getElementById(id);

  function setStatus(msg, isError) {
    const el = $('ch-status');
    el.textContent = msg;
    el.classList.toggle('error', !!isError);
  }

  function dateKey(d) {
    const x = d instanceof Date ? d : new Date(d);
    return x.toISOString().slice(0, 10);
  }

  function addActivity(map, day, platform, count) {
    if (!day || !count) return;
    if (!map[day]) map[day] = { github: 0, leetcode: 0, codeforces: 0, total: 0 };
    map[day][platform] += count;
    map[day].total = map[day].github + map[day].leetcode + map[day].codeforces;
  }

  function readCache(key) {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const all = JSON.parse(raw);
      const hit = all[key];
      if (!hit || Date.now() - hit.ts > CACHE_TTL_MS) return null;
      return hit.data;
    } catch {
      return null;
    }
  }

  function writeCache(key, data) {
    try {
      const all = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      all[key] = { ts: Date.now(), data };
      localStorage.setItem(CACHE_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('cache write failed', e);
    }
  }

  async function fetchGitHub(user) {
    const map = {};
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}/events?per_page=100`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const events = await res.json();
    events.forEach((ev) => {
      const day = dateKey(ev.created_at);
      addActivity(map, day, 'github', 1);
    });
    return map;
  }

  async function fetchCodeforces(user) {
    const map = {};
    const res = await fetch(
      `https://codeforces.com/api/user.status?handle=${encodeURIComponent(user)}&from=1&count=500`
    );
    if (!res.ok) throw new Error(`Codeforces HTTP ${res.status}`);
    const json = await res.json();
    if (json.status !== 'OK') throw new Error(json.comment || 'Codeforces error');
    const yearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    json.result.forEach((sub) => {
      if (!sub.creationTimeSeconds) return;
      const ms = sub.creationTimeSeconds * 1000;
      if (ms < yearAgo) return;
      if (sub.verdict !== 'OK') return;
      addActivity(map, dateKey(ms), 'codeforces', 1);
    });
    return map;
  }

  async function fetchLeetCode(user) {
    const map = {};
    // Public calendar endpoint (may be blocked by CORS in some browsers — fallback demo)
    const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${encodeURIComponent(user)}`);
    if (!res.ok) throw new Error(`LeetCode ${res.status}`);
    const json = await res.json();
    if (json.status === 'error') throw new Error(json.message || 'LeetCode user not found');
    const cal = json.submissionCalendar || {};
    Object.keys(cal).forEach((ts) => {
      const day = dateKey(Number(ts) * 1000);
      addActivity(map, day, 'leetcode', Number(cal[ts]) || 0);
    });
    return map;
  }

  function mergeMaps(targets) {
    const out = {};
    targets.forEach((m) => {
      Object.keys(m).forEach((day) => {
        const row = m[day];
        ['github', 'leetcode', 'codeforces'].forEach((p) => addActivity(out, day, p, row[p] || 0));
      });
    });
    return out;
  }

  function filteredCount(dayRow) {
    if (!dayRow) return 0;
    let n = 0;
    if (state.enabled.github) n += dayRow.github || 0;
    if (state.enabled.leetcode) n += dayRow.leetcode || 0;
    if (state.enabled.codeforces) n += dayRow.codeforces || 0;
    return n;
  }

  function levelFor(count) {
    if (count <= 0) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    if (count <= 6) return 3;
    return 4;
  }

  function renderHeatmap() {
    const root = $('ch-heatmap');
    root.innerHTML = '';
    const weeks = document.createElement('div');
    weeks.className = 'ch-weeks';

    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - 364);
    while (start.getDay() !== 0) start.setDate(start.getDate() - 1);

    const tip = $('ch-tooltip');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = dateKey(d);
      const row = state.byDate[key];
      const count = filteredCount(row);
      const cell = document.createElement('div');
      cell.className = 'ch-cell';
      cell.dataset.level = String(levelFor(count));
      cell.dataset.date = key;
      cell.tabIndex = 0;
      cell.setAttribute('aria-label', `${key}: ${count} contributions`);
      const showTip = (ev) => {
        const parts = [];
        if (row) {
          if (state.enabled.github && row.github) parts.push(`GitHub ${row.github}`);
          if (state.enabled.leetcode && row.leetcode) parts.push(`LeetCode ${row.leetcode}`);
          if (state.enabled.codeforces && row.codeforces) parts.push(`Codeforces ${row.codeforces}`);
        }
        tip.textContent = `${key} · ${count} total${parts.length ? ' · ' + parts.join(', ') : ''}`;
        tip.classList.remove('hidden');
        tip.style.left = `${Math.min(window.innerWidth - 220, ev.clientX + 12)}px`;
        tip.style.top = `${ev.clientY + 14}px`;
      };
      cell.addEventListener('mousemove', showTip);
      cell.addEventListener('mouseleave', () => tip.classList.add('hidden'));
      cell.addEventListener('focus', (e) => showTip({ clientX: e.target.getBoundingClientRect().left, clientY: e.target.getBoundingClientRect().bottom }));
      cell.addEventListener('blur', () => tip.classList.add('hidden'));
      weeks.appendChild(cell);
    }
    root.appendChild(weeks);
    renderStats();
  }

  function renderStats() {
    let total = 0;
    let active = 0;
    const weekly = Array(7).fill(0);
    const monthly = {};
    const byPlat = { github: 0, leetcode: 0, codeforces: 0 };

    Object.keys(state.byDate).forEach((day) => {
      const row = state.byDate[day];
      const c = filteredCount(row);
      if (c > 0) {
        total += c;
        active += 1;
        weekly[new Date(day + 'T12:00:00').getDay()] += c;
        const m = day.slice(0, 7);
        monthly[m] = (monthly[m] || 0) + c;
      }
      if (state.enabled.github) byPlat.github += row.github || 0;
      if (state.enabled.leetcode) byPlat.leetcode += row.leetcode || 0;
      if (state.enabled.codeforces) byPlat.codeforces += row.codeforces || 0;
    });

    const bestMonth = Object.keys(monthly).sort((a, b) => monthly[b] - monthly[a])[0];
    const weekTotal = weekly.reduce((a, b) => a + b, 0);

    $('ch-stats').innerHTML = `
      <div class="ch-stat"><strong>${total}</strong>Total activity</div>
      <div class="ch-stat"><strong>${active}</strong>Active days</div>
      <div class="ch-stat"><strong>${byPlat.github}</strong>GitHub</div>
      <div class="ch-stat"><strong>${byPlat.leetcode}</strong>LeetCode</div>
      <div class="ch-stat"><strong>${byPlat.codeforces}</strong>Codeforces</div>
      <div class="ch-stat"><strong>${weekTotal}</strong>Weekday sum</div>
      <div class="ch-stat"><strong>${bestMonth || '—'}</strong>Best month</div>
    `;
  }

  async function loadAll(e) {
    e.preventDefault();
    const gh = $('ch-gh').value.trim();
    const lc = $('ch-lc').value.trim();
    const cf = $('ch-cf').value.trim();
    if (!gh && !lc && !cf) {
      setStatus('Enter at least one username.', true);
      return;
    }

    const cacheKey = `gh:${gh}|lc:${lc}|cf:${cf}`;
    const cached = readCache(cacheKey);
    if (cached) {
      state.byDate = cached;
      setStatus('Loaded from local cache (rate-limit friendly).');
      renderHeatmap();
      return;
    }

    setStatus('Fetching public activity…');
    $('ch-load').disabled = true;
    const maps = [];
    const notes = [];

    try {
      if (gh) {
        try {
          maps.push(await fetchGitHub(gh));
          notes.push('GitHub ✓');
        } catch (err) {
          notes.push(`GitHub ✗ (${err.message})`);
        }
      }
      if (cf) {
        try {
          maps.push(await fetchCodeforces(cf));
          notes.push('Codeforces ✓');
        } catch (err) {
          notes.push(`Codeforces ✗ (${err.message})`);
        }
      }
      if (lc) {
        try {
          maps.push(await fetchLeetCode(lc));
          notes.push('LeetCode ✓');
        } catch (err) {
          notes.push(`LeetCode ✗ (${err.message})`);
        }
      }

      state.byDate = mergeMaps(maps);
      if (Object.keys(state.byDate).length === 0) {
        setStatus(`No activity found. ${notes.join(' · ')}`, true);
        $('ch-stats').innerHTML = '<div class="ch-empty">Empty — try different usernames or check CORS/rate limits.</div>';
        $('ch-heatmap').innerHTML = '';
      } else {
        writeCache(cacheKey, state.byDate);
        setStatus(`Loaded. ${notes.join(' · ')}`);
        renderHeatmap();
      }
    } finally {
      $('ch-load').disabled = false;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('ch-form').addEventListener('submit', loadAll);
    document.querySelectorAll('.ch-filters input').forEach((input) => {
      input.addEventListener('change', () => {
        state.enabled[input.dataset.platform] = input.checked;
        renderHeatmap();
      });
    });
  });
})();
