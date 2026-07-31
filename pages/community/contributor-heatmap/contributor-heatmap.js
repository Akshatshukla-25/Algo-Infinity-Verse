(function () {
  'use strict';

  const CACHE_KEY = 'aiv_contributor_heatmap_v1';
  const CACHE_TTL = 6 * 60 * 60 * 1000;

  let current = null;

  const $ = (id) => document.getElementById(id);

  function setStatus(msg, err) {
    const el = $('cth-status');
    el.textContent = msg;
    el.classList.toggle('error', !!err);
  }

  function dayKey(d) {
    return (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10);
  }

  function level(n) {
    if (n <= 0) return 0;
    if (n <= 2) return 1;
    if (n <= 5) return 2;
    if (n <= 9) return 3;
    return 4;
  }

  function readCache(user) {
    try {
      const all = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const hit = all[user.toLowerCase()];
      if (!hit || Date.now() - hit.ts > CACHE_TTL) return null;
      return hit.data;
    } catch {
      return null;
    }
  }

  function writeCache(user, data) {
    try {
      const all = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      all[user.toLowerCase()] = { ts: Date.now(), data };
      localStorage.setItem(CACHE_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn(e);
    }
  }

  async function fetchContributions(username) {
    // Public scrape-safe contribution JSON APIs (try primary, then fallback)
    const endpoints = [
      `https://github-contributions-api.jograca.com/v4/${encodeURIComponent(username)}?y=last`,
      `https://github-contributions.vercel.app/api/v1/${encodeURIComponent(username)}`,
    ];

    let lastErr = null;
    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return normalizePayload(username, json);
      } catch (err) {
        lastErr = err;
      }
    }

    // Fallback: approximate from public events (partial year)
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events?per_page=100`);
    if (!res.ok) throw lastErr || new Error(`GitHub ${res.status}`);
    const events = await res.json();
    const byDate = {};
    events.forEach((ev) => {
      const k = dayKey(ev.created_at);
      byDate[k] = (byDate[k] || 0) + 1;
    });
    return buildFromMap(username, byDate, 'Partial (GitHub events fallback)');
  }

  function normalizePayload(username, json) {
    const byDate = {};
    if (Array.isArray(json.contributions)) {
      json.contributions.forEach((c) => {
        const date = c.date || c.day;
        const count = Number(c.count ?? c.contributionCount ?? 0);
        if (date) byDate[date] = count;
      });
    } else if (json.contributions && typeof json.contributions === 'object') {
      // some APIs nest years
      Object.values(json.contributions).forEach((yearBlock) => {
        if (Array.isArray(yearBlock)) {
          yearBlock.forEach((c) => {
            if (c.date) byDate[c.date] = Number(c.count || 0);
          });
        }
      });
    } else if (Array.isArray(json)) {
      json.forEach((c) => {
        if (c.date) byDate[c.date] = Number(c.count || 0);
      });
    }

    if (!Object.keys(byDate).length && json.total) {
      throw new Error('Unexpected contribution payload');
    }
    return buildFromMap(username, byDate, 'Public contributions API');
  }

  function buildFromMap(username, byDate, source) {
    let total = 0;
    let activeDays = 0;
    const days = Object.keys(byDate).sort();
    days.forEach((d) => {
      const n = byDate[d] || 0;
      total += n;
      if (n > 0) activeDays += 1;
    });

    const { currentStreak, longestStreak } = streaks(byDate);
    return { username, byDate, total, activeDays, currentStreak, longestStreak, source };
  }

  function streaks(byDate) {
    const end = new Date();
    end.setHours(12, 0, 0, 0);
    let longest = 0;
    let run = 0;
    let current = 0;
    let countingCurrent = true;

    for (let i = 0; i < 400; i++) {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      const k = dayKey(d);
      const n = byDate[k] || 0;
      if (n > 0) {
        run += 1;
        longest = Math.max(longest, run);
        if (countingCurrent) current = run;
      } else {
        run = 0;
        if (i > 0) countingCurrent = false;
      }
    }
    return { currentStreak: current, longestStreak: longest };
  }

  function renderHeatmap(data) {
    const root = $('cth-heatmap');
    root.innerHTML = '';
    const weeks = document.createElement('div');
    weeks.className = 'cth-weeks';

    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - 364);
    while (start.getDay() !== 0) start.setDate(start.getDate() - 1);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const k = dayKey(d);
      const n = data.byDate[k] || 0;
      const cell = document.createElement('div');
      cell.className = 'cth-cell';
      cell.dataset.l = String(level(n));
      cell.title = `${k}: ${n} contributions`;
      weeks.appendChild(cell);
    }
    root.appendChild(weeks);
  }

  function renderStats(data) {
    $('cth-stats').innerHTML = `
      <div class="cth-stat"><strong>${data.total}</strong>Contributions</div>
      <div class="cth-stat"><strong>${data.activeDays}</strong>Active days</div>
      <div class="cth-stat"><strong>${data.currentStreak}</strong>Current streak</div>
      <div class="cth-stat"><strong>${data.longestStreak}</strong>Longest streak</div>
    `;
  }

  function buildSvg(data) {
    const name = data.username.replace(/[<>&]/g, '');
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="520" height="200" viewBox="0 0 520 200" role="img" aria-label="AIV stats card for ${name}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  <rect width="520" height="200" rx="16" fill="#0b1220"/>
  <rect x="1" y="1" width="518" height="198" rx="15" fill="none" stroke="url(#g)" stroke-width="2"/>
  <text x="28" y="42" fill="#06b6d4" font-family="Segoe UI, Arial" font-size="14" font-weight="700">ALGO INFINITY VERSE</text>
  <text x="28" y="78" fill="#f8fafc" font-family="Segoe UI, Arial" font-size="28" font-weight="700">@${name}</text>
  <text x="28" y="118" fill="#94a3b8" font-family="Segoe UI, Arial" font-size="14">GitHub contributor card</text>
  <text x="28" y="160" fill="#a78bfa" font-family="Segoe UI, Arial" font-size="16">${data.total} contributions</text>
  <text x="220" y="160" fill="#67e8f9" font-family="Segoe UI, Arial" font-size="16">${data.activeDays} active days</text>
  <text x="28" y="184" fill="#cbd5e1" font-family="Segoe UI, Arial" font-size="13">Streak ${data.currentStreak} · Best ${data.longestStreak}</text>
</svg>`;
  }

  function renderCard(data) {
    const svg = buildSvg(data);
    $('cth-svg-wrap').innerHTML = svg;
    $('cth-dl').disabled = false;
    $('cth-copy').disabled = false;
  }

  async function onSearch(e) {
    e.preventDefault();
    const user = $('cth-user').value.trim().replace(/^@/, '');
    if (!user) return;

    const cached = readCache(user);
    if (cached) {
      current = cached;
      setStatus(`Loaded @${user} from cache (${cached.source}).`);
      renderHeatmap(cached);
      renderStats(cached);
      renderCard(cached);
      return;
    }

    setStatus('Fetching public contribution data…');
    $('cth-search').disabled = true;
    try {
      const data = await fetchContributions(user);
      current = data;
      writeCache(user, data);
      setStatus(`Loaded @${user} via ${data.source}.`);
      renderHeatmap(data);
      renderStats(data);
      renderCard(data);
    } catch (err) {
      setStatus(`Could not load @${user}: ${err.message}`, true);
      $('cth-stats').innerHTML = '<div class="cth-empty">Error — check username or rate limits.</div>';
      $('cth-heatmap').innerHTML = '';
      $('cth-svg-wrap').innerHTML = '';
      $('cth-dl').disabled = true;
      $('cth-copy').disabled = true;
    } finally {
      $('cth-search').disabled = false;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('cth-form').addEventListener('submit', onSearch);
    $('cth-dl').addEventListener('click', () => {
      if (!current) return;
      const blob = new Blob([buildSvg(current)], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aiv-${current.username}-stats.svg`;
      a.click();
      URL.revokeObjectURL(url);
    });
    $('cth-copy').addEventListener('click', async () => {
      if (!current) return;
      try {
        await navigator.clipboard.writeText(buildSvg(current));
        setStatus('SVG copied to clipboard.');
      } catch {
        setStatus('Copy failed — download SVG instead.', true);
      }
    });
  });
})();
