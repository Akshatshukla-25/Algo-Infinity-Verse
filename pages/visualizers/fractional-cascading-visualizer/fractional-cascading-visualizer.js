document.addEventListener('DOMContentLoaded', function() {
  fcInit();
});

var FC_COLORS = ['#06b6d4', '#a855f7', '#22c55e', '#f59e0b', '#ec4899'];

var fcState = {
  K: 4,
  lists: [],
  cascaded: [],
  lastSearch: null,
};

function fcGenerateLists(k) {
  var lists = [];
  for (var i = 0; i < k; i++) {
    var arr = [];
    var val = Math.floor(Math.random() * 10);
    var count = 6 + Math.floor(Math.random() * 3);
    for (var j = 0; j < count; j++) { val += 2 + Math.floor(Math.random() * 8); arr.push(val); }
    lists.push(arr);
  }
  return lists;
}

function fcBuildCascade(lists) {
  var k = lists.length;
  var cascaded = new Array(k);
  cascaded[k - 1] = lists[k - 1].map(function(v) { return { v: v, bridge: -1, isOriginal: true }; });

  for (var i = k - 2; i >= 0; i--) {
    var promoted = [];
    for (var j = 0; j < cascaded[i + 1].length; j += 2) promoted.push({ v: cascaded[i + 1][j].v, isOriginal: false });

    var orig = lists[i].map(function(v) { return { v: v, isOriginal: true }; });
    var merged = orig.concat(promoted).sort(function(a, b) { return a.v - b.v; });

    var p = 0;
    merged.forEach(function(e) {
      while (p < cascaded[i + 1].length && cascaded[i + 1][p].v < e.v) p++;
      e.bridge = p < cascaded[i + 1].length ? p : cascaded[i + 1].length - 1;
    });

    cascaded[i] = merged;
  }
  return cascaded;
}

function fcLowerBound(arr, x) {
  var lo = 0, hi = arr.length;
  while (lo < hi) { var mid = (lo + hi) >> 1; if (arr[mid].v < x) lo = mid + 1; else hi = mid; }
  return lo;
}

function fcSuccessorInOriginal(level, startPos) {
  for (var i = startPos; i < level.length; i++) if (level[i].isOriginal) return level[i].v;
  return null;
}

function fcSearch(cascaded, x, log) {
  var results = [];
  var opsCount = 0;
  var pos = fcLowerBound(cascaded[0], x);
  opsCount += Math.ceil(Math.log2(cascaded[0].length + 1));

  if (log) log.push({ msg: 'Binary search in Track 0 for successor of ' + x + ' — found at position ' + pos + '. (This is the ONLY binary search in the whole query.)', type: 'done' });

  results.push(fcSuccessorInOriginal(cascaded[0], pos));

  var curBridge = pos < cascaded[0].length
    ? cascaded[0][pos].bridge
    : (cascaded[1] ? cascaded[1].length : 0);

  for (var i = 1; i < cascaded.length; i++) {
    var lvl = cascaded[i];
    var p = curBridge;
    var adjustSteps = 0;
    while (p > 0 && lvl[p - 1] && lvl[p - 1].v >= x) { p--; adjustSteps++; }
    while (p < lvl.length && lvl[p].v < x) { p++; adjustSteps++; }

    opsCount += 1;

    var result = fcSuccessorInOriginal(lvl, p);
    results.push(result);

    if (log) log.push({ msg: 'Track ' + i + ': bridge jump + ' + adjustSteps + ' local adjustment step(s) → successor = ' + (result !== null ? result : 'none') + '. No binary search needed.', type: 'bridge' });

    curBridge = lvl[p] ? lvl[p].bridge : (lvl.length ? lvl[lvl.length - 1].bridge : 0);
  }

  return { results: results, ops: opsCount };
}

function fcRenderTracks(highlightPositions) {
  var canvas = document.getElementById('fcTracksCanvas');
  if (!canvas || fcState.cascaded.length === 0) return;
  var wrap = canvas.parentElement;
  var K = fcState.cascaded.length;
  var maxLen = Math.max.apply(null, fcState.cascaded.map(function(c) { return c.length; }));

  var trackW = Math.max(wrap.clientWidth, K * 130);
  var H = 420;
  canvas.width = trackW; canvas.height = H;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, trackW, H);

  var colW = trackW / K;
  var pad = { top: 30, bottom: 30 };
  var rowH = (H - pad.top - pad.bottom) / Math.max(1, maxLen - 1);

  var positions = fcState.cascaded.map(function(track, ti) {
    var cx = colW * ti + colW / 2;
    return track.map(function(e, ei) { return { x: cx, y: pad.top + ei * rowH, e: e }; });
  });

  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  for (var ti = 0; ti < K; ti++) {
    var cx = colW * ti + colW / 2;
    ctx.beginPath(); ctx.moveTo(cx, pad.top - 10); ctx.lineTo(cx, H - pad.bottom + 10); ctx.stroke();
  }

  for (var ti = 0; ti < K - 1; ti++) {
    positions[ti].forEach(function(p) {
      var bridgeIdx = p.e.bridge;
      if (bridgeIdx < 0 || !positions[ti + 1][bridgeIdx]) return;
      var target = positions[ti + 1][bridgeIdx];
      ctx.strokeStyle = p.e.isOriginal ? 'rgba(6,182,212,0.15)' : 'rgba(168,85,247,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x + 14, p.y);
      ctx.bezierCurveTo(p.x + colW / 2, p.y, target.x - colW / 2, target.y, target.x - 14, target.y);
      ctx.stroke();
    });
  }

  var highlightSet = {};
  if (highlightPositions) highlightPositions.forEach(function(hp, i) { highlightSet[i + '-' + hp] = true; });

  positions.forEach(function(track, ti) {
    ctx.fillStyle = 'rgba(148,163,184,0.5)';
    ctx.font = 'bold 10px Poppins,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Track ' + ti, colW * ti + colW / 2, 16);

    track.forEach(function(p, ei) {
      var e = p.e;
      var isHighlighted = highlightSet[ti + '-' + ei];
      var color = FC_COLORS[ti % FC_COLORS.length];

      if (e.isOriginal) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, isHighlighted ? 11 : 8, 0, Math.PI * 2);
        ctx.fillStyle = isHighlighted ? color : color + '55';
        ctx.fill();
        ctx.strokeStyle = isHighlighted ? '#fff' : color;
        ctx.lineWidth = isHighlighted ? 2 : 1.2;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, isHighlighted ? 9 : 6, 0, Math.PI * 2);
        ctx.strokeStyle = isHighlighted ? '#f59e0b' : 'rgba(168,85,247,0.5)';
        ctx.lineWidth = isHighlighted ? 2.5 : 1.3;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = isHighlighted ? '#fff' : 'rgba(203,213,225,0.75)';
      ctx.font = (isHighlighted ? 'bold ' : '') + '9px Fira Code,monospace'; ctx.textAlign = 'left';
      ctx.fillText(e.v, p.x + 15, p.y + 3);
    });
  });
}

function fcRenderResults(results) {
  var container = document.getElementById('fcResultsRow');
  if (!container) return;
  container.innerHTML = results.map(function(r, i) {
    var color = FC_COLORS[i % FC_COLORS.length];
    return '<div class="fc-result-chip">' +
      '<div class="fc-result-list-label" style="color:' + color + '">List ' + i + '</div>' +
      '<div class="fc-result-val' + (r === null ? ' none' : '') + '">' + (r !== null ? r : 'no successor') + '</div>' +
    '</div>';
  }).join('');
}

function fcAddLog(msg, cls) {
  var log = document.getElementById('fcLog');
  if (!log) return;
  var empty = log.querySelector('.fc-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'fc-log-entry ' + (cls || '');
  entry.textContent = msg;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function fcSetStatus(msg, cls) {
  var el = document.getElementById('fcStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'fc-status ' + (cls || '');
}

function fcBuildAndRender() {
  fcState.lists = fcGenerateLists(fcState.K);
  fcState.cascaded = fcBuildCascade(fcState.lists);
  fcRenderTracks(null);

  var results = fcState.lists.map(function() { return null; });
  fcRenderResults(results);

  var log = document.getElementById('fcLog');
  if (log) log.innerHTML = '<div class="fc-empty">Run a search to see the trace.</div>';

  fcSetStatus(fcState.K + ' sorted lists cascaded into ' + fcState.K + ' bridged tracks. Enter a value and search.', '');
}

function fcSearchHandler() {
  if (fcState.cascaded.length === 0) { fcSetStatus('Build cascaded tracks first.', ''); return; }
  var input = document.getElementById('fcQueryInput');
  var x = parseInt(input ? input.value : NaN);
  if (isNaN(x)) { fcSetStatus('Enter a valid query value.', ''); return; }

  var log = document.getElementById('fcLog');
  if (log) log.innerHTML = '';

  var trace = [];
  var searchResult = fcSearch(fcState.cascaded, x, trace);
  trace.forEach(function(entry) { fcAddLog(entry.msg, entry.type); });

  fcRenderResults(searchResult.results);

  var highlightPositions = [];
  fcState.cascaded.forEach(function(track, ti) {
    var pos = fcLowerBound(track, x);
    highlightPositions.push(pos < track.length ? pos : track.length - 1);
  });
  fcRenderTracks(highlightPositions);

  var cascadeOpsEl = document.getElementById('fcCascadeOps');
  var naiveOpsEl = document.getElementById('fcNaiveOps');
  var naiveOps = fcState.lists.reduce(function(sum, list) { return sum + Math.ceil(Math.log2(list.length + 1)); }, 0);
  if (cascadeOpsEl) cascadeOpsEl.textContent = searchResult.ops + ' operations';
  if (naiveOpsEl) naiveOpsEl.textContent = naiveOps + ' operations (' + fcState.lists.length + ' separate binary searches)';

  fcSetStatus('Searched ' + fcState.K + ' lists for successor of ' + x + ' using ' + searchResult.ops + ' total operations — one binary search, rest O(1) bridge hops.', 'good');
}

function fcInit() {
  document.querySelectorAll('.fc-k-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.fc-k-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      fcState.K = parseInt(btn.getAttribute('data-k'));
      fcBuildAndRender();
    });
  });

  var randomizeBtn = document.getElementById('fcRandomizeBtn');
  var searchBtn = document.getElementById('fcSearchBtn');
  if (randomizeBtn) randomizeBtn.addEventListener('click', fcBuildAndRender);
  if (searchBtn) searchBtn.addEventListener('click', fcSearchHandler);

  var queryInput = document.getElementById('fcQueryInput');
  if (queryInput) queryInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') fcSearchHandler(); });

  fcBuildAndRender();
  fcInitHeroCanvas();

  window.addEventListener('resize', function() { fcRenderTracks(null); });
}

function fcInitHeroCanvas() {
  var canvas = document.getElementById('fcHeroCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var t = 0;
  var nodes = [];

  function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    nodes = [];
    var cols = 5;
    for (var c = 0; c < cols; c++) {
      var rows = 4 + (c % 2);
      for (var r = 0; r < rows; r++) {
        nodes.push({ x: (c + 0.5) / cols * canvas.width, y: (r + 0.5) / rows * canvas.height, col: c, phase: Math.random() * 10 });
      }
    }
  }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    var W = canvas.width; var H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    t += 0.01;

    nodes.forEach(function(n) {
      var wobble = Math.sin(t + n.phase) * 6;
      var neighbor = nodes.find(function(m) { return m.col === n.col + 1 && Math.abs(m.y - n.y) < H / 3; });
      if (neighbor) {
        ctx.strokeStyle = 'rgba(6,182,212,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(n.x, n.y + wobble);
        ctx.bezierCurveTo(n.x + 40, n.y + wobble, neighbor.x - 40, neighbor.y + wobble, neighbor.x, neighbor.y + wobble);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(n.x, n.y + wobble, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(168,85,247,0.25)';
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }
  draw();
}