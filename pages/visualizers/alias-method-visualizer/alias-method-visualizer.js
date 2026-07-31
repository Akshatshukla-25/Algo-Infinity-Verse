document.addEventListener('DOMContentLoaded', function() {
  amInit();
});

var AM_COLORS = ['#06b6d4', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];
var AM_ITEMS = ['Sword', 'Shield', 'Potion', 'Gem', 'Scroll', 'Coin'];

var amState = { weights: [10, 20, 15, 5, 25, 25], table: null, verifyHistory: [] };

function amBuildAlias(weights) {
  var n = weights.length;
  var total = weights.reduce(function(a, b) { return a + b; }, 0);
  var probScaled = weights.map(function(w) { return (w / total) * n; });

  var prob = new Array(n);
  var alias = new Array(n);
  var small = [];
  var large = [];

  probScaled.forEach(function(p, i) { if (p < 1) small.push(i); else large.push(i); });

  while (small.length > 0 && large.length > 0) {
    var s = small.pop();
    var l = large.pop();
    prob[s] = probScaled[s];
    alias[s] = l;
    probScaled[l] = probScaled[l] + probScaled[s] - 1;
    if (probScaled[l] < 1) small.push(l); else large.push(l);
  }

  while (large.length > 0) { var l2 = large.pop(); prob[l2] = 1; alias[l2] = l2; }
  while (small.length > 0) { var s2 = small.pop(); prob[s2] = 1; alias[s2] = s2; }

  return { prob: prob, alias: alias, n: n };
}

function amSample(table) {
  var i = Math.floor(Math.random() * table.n);
  var coin = Math.random();
  var winner = coin < table.prob[i] ? i : table.alias[i];
  return { i: i, coin: coin, threshold: table.prob[i], winner: winner, usedAlias: winner !== i };
}

function amRenderItems() {
  var container = document.getElementById('amItemsRow');
  if (!container) return;
  container.innerHTML = amState.weights.map(function(w, i) {
    var color = AM_COLORS[i % AM_COLORS.length];
    return '<div class="am-item-slider" style="color:' + color + '">' +
      '<span class="am-item-label">' + AM_ITEMS[i] + '</span>' +
      '<input type="range" class="am-item-range" aria-label="Weight for ' + AM_ITEMS[i] + '" data-idx="' + i + '" min="1" max="50" value="' + w + '" />' +
      '<span class="am-item-weight" id="amWeight' + i + '">weight ' + w + '</span>' +
    '</div>';
  }).join('');

  container.querySelectorAll('.am-item-range').forEach(function(input) {
    input.addEventListener('input', function() {
      var idx = parseInt(this.getAttribute('data-idx'));
      amState.weights[idx] = parseInt(this.value);
      var lbl = document.getElementById('amWeight' + idx);
      if (lbl) lbl.textContent = 'weight ' + amState.weights[idx];
    });
  });
}

function amRenderTable() {
  var wrap = document.getElementById('amTableWrap');
  if (!wrap || !amState.table) return;
  var table = amState.table;

  var rows = table.prob.map(function(p, i) {
    var color = AM_COLORS[i % AM_COLORS.length];
    return '<tr>' +
      '<td style="color:' + color + ';font-weight:700">' + AM_ITEMS[i] + '</td>' +
      '<td class="am-prob-cell">' + p.toFixed(3) + '</td>' +
      '<td class="am-alias-cell">' + AM_ITEMS[table.alias[i]] + '</td>' +
    '</tr>';
  }).join('');

  wrap.innerHTML = '<table class="am-table"><thead><tr><th>Item</th><th>prob[i]</th><th>alias[i]</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

function amSetStatus(msg, cls) {
  var el = document.getElementById('amStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'am-status ' + (cls || '');
}

function amBuildHandler() {
  amState.table = amBuildAlias(amState.weights);
  amRenderTable();

  var naiveEl = document.getElementById('amNaiveOps');
  if (naiveEl) naiveEl.textContent = 'up to ' + amState.weights.length + ' (avg ' + (amState.weights.length / 2).toFixed(1) + ')';

  amSetStatus('Alias table built for ' + amState.weights.length + ' items. Every future sample now costs exactly 2 operations, regardless of item count.', 'good');

  var traceEl = document.getElementById('amSampleTrace');
  if (traceEl) traceEl.textContent = 'Table ready. Draw a sample to see the O(1) lookup.';
}

function amSampleHandler() {
  if (!amState.table) { amSetStatus('Build the alias table first.', ''); return; }

  var result = amSample(amState.table);
  var traceEl = document.getElementById('amSampleTrace');
  if (traceEl) {
    traceEl.innerHTML = 'Random slot i = <strong>' + result.i + '</strong> (' + AM_ITEMS[result.i] + '). ' +
      'Coin flip = ' + result.coin.toFixed(3) + ' vs prob[i] = ' + result.threshold.toFixed(3) + '. ' +
      (result.usedAlias
        ? 'Coin ≥ threshold → redirected to alias[' + result.i + '] = <strong>' + AM_ITEMS[result.winner] + '</strong>.'
        : 'Coin < threshold → kept original item: <strong>' + AM_ITEMS[result.winner] + '</strong>.');
  }

  amSetStatus('Sampled "' + AM_ITEMS[result.winner] + '" in exactly 2 operations — one index, one coin flip.', 'good');
}

function amRunVerification() {
  if (!amState.table) { amSetStatus('Build the alias table first.', ''); return; }

  var n = amState.table.n;
  var counts = new Array(n).fill(0);
  var trials = 10000;

  for (var t = 0; t < trials; t++) {
    var result = amSample(amState.table);
    counts[result.winner]++;
  }

  var totalWeight = amState.weights.reduce(function(a, b) { return a + b; }, 0);
  var expected = amState.weights.map(function(w) { return w / totalWeight; });
  var empirical = counts.map(function(c) { return c / trials; });

  amState.verifyHistory = [expected, empirical];
  amDrawVerifyChart(expected, empirical);
  amSetStatus('Ran ' + trials.toLocaleString() + ' samples. Empirical frequencies closely match the input weight distribution.', 'good');
}

function amDrawVerifyChart(expected, empirical) {
  var canvas = document.getElementById('amVerifyCanvas');
  if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 200;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var n = expected.length;
  var W = canvas.width; var H = canvas.height;
  var pad = { top: 15, right: 15, bottom: 35, left: 40 };
  var plotW = W - pad.left - pad.right;
  var plotH = H - pad.top - pad.bottom;

  var maxVal = Math.max.apply(null, expected.concat(empirical)) * 1.2;
  var groupW = plotW / n;
  var barW = groupW / 3;

  function yPos(v) { return pad.top + (1 - v / maxVal) * plotH; }

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (var i = 0; i <= 4; i++) {
    var y = pad.top + (i / 4) * plotH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    ctx.fillStyle = 'rgba(148,163,184,0.4)'; ctx.font = '8px Fira Code,monospace'; ctx.textAlign = 'right';
    ctx.fillText((maxVal * (1 - i / 4)).toFixed(2), pad.left - 4, y + 3);
  }

  for (var i = 0; i < n; i++) {
    var gx = pad.left + i * groupW;
    var expH = plotH - (yPos(expected[i]) - pad.top);
    var empH = plotH - (yPos(empirical[i]) - pad.top);

    ctx.fillStyle = 'rgba(6,182,212,0.6)';
    ctx.fillRect(gx + barW * 0.3, yPos(expected[i]), barW * 0.8, expH);

    ctx.fillStyle = 'rgba(245,158,11,0.6)';
    ctx.fillRect(gx + barW * 1.3, yPos(empirical[i]), barW * 0.8, empH);

    ctx.fillStyle = AM_COLORS[i % AM_COLORS.length];
    ctx.font = '8px Fira Code,monospace'; ctx.textAlign = 'center';
    ctx.fillText(AM_ITEMS[i], gx + groupW / 2, H - 15);
  }

  ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 8px Poppins,sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('■ Expected', pad.left, 12);
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('■ Empirical (10,000 samples)', pad.left + 70, 12);
}

function amInit() {
  amRenderItems();

  var buildBtn = document.getElementById('amBuildBtn');
  var randomizeBtn = document.getElementById('amRandomizeBtn');
  var sampleBtn = document.getElementById('amSampleBtn');
  var verifyBtn = document.getElementById('amVerifyBtn');

  if (buildBtn) buildBtn.addEventListener('click', amBuildHandler);
  if (randomizeBtn) randomizeBtn.addEventListener('click', function() {
    amState.weights = amState.weights.map(function() { return 1 + Math.floor(Math.random() * 49); });
    amRenderItems();
    amState.table = null;
    var wrap = document.getElementById('amTableWrap');
    if (wrap) wrap.innerHTML = '<div class="am-empty">Build the table to see it here.</div>';
    amSetStatus('Weights randomized. Build the alias table to preprocess.', '');
  });
  if (sampleBtn) sampleBtn.addEventListener('click', amSampleHandler);
  if (verifyBtn) verifyBtn.addEventListener('click', amRunVerification);

  amBuildHandler();
  window.addEventListener('resize', function() {
    if (amState.verifyHistory.length) amDrawVerifyChart(amState.verifyHistory[0], amState.verifyHistory[1]);
  });
}