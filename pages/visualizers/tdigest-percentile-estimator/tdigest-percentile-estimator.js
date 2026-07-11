document.addEventListener('DOMContentLoaded', function() {
  tdInit();
});

var tdState = {
  delta: 100,
  distribution: 'lognormal',
  rawValues: [],
  centroids: [],
  streaming: false,
};

function tdGenerateValue(dist) {
  if (dist === 'lognormal') {
    return Math.exp(Math.random() * 2 + 3);
  } else if (dist === 'uniform') {
    return 10 + Math.random() * 200;
  } else {
    return Math.random() < 0.85 ? (20 + Math.random() * 30) : (300 + Math.random() * 200);
  }
}

function tdScaleLimit(qLow, qHigh, n, delta) {
  var q = (qLow + qHigh) / 2;
  return Math.max(1, 4 * n * q * (1 - q) / delta);
}

function tdCompress(values, delta) {
  var sorted = values.slice().sort(function(a, b) { return a - b; });
  var n = sorted.length;
  var centroids = [];
  var i = 0;

  while (i < n) {
    var mean = sorted[i];
    var count = 1;
    var cumBefore = i;
    i++;

    while (i < n) {
      var qLow = cumBefore / n;
      var qHigh = (cumBefore + count + 1) / n;
      if (count + 1 <= tdScaleLimit(qLow, qHigh, n, delta)) {
        mean = (mean * count + sorted[i]) / (count + 1);
        count++;
        i++;
      } else break;
    }

    centroids.push({ mean: mean, count: count });
  }

  return centroids;
}

function tdPercentileFromCentroids(centroids, q) {
  if (centroids.length === 0) return null;
  var total = centroids.reduce(function(a, c) { return a + c.count; }, 0);
  var target = q * total;
  var cum = 0;

  for (var i = 0; i < centroids.length; i++) {
    var c = centroids[i];
    if (cum + c.count >= target) return c.mean;
    cum += c.count;
  }

  return centroids[centroids.length - 1].mean;
}

function tdExactPercentile(sortedValues, q) {
  if (sortedValues.length === 0) return null;
  var idx = Math.min(sortedValues.length - 1, Math.floor(q * sortedValues.length));
  return sortedValues[idx];
}

function tdRenderCentroidCanvas() {
  var canvas = document.getElementById('tdCentroidCanvas');
  if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 260;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var centroids = tdState.centroids;
  if (centroids.length === 0) {
    ctx.fillStyle = 'rgba(148,163,184,0.3)'; ctx.font = '12px Poppins,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Stream values to build the digest', canvas.width / 2, canvas.height / 2);
    return;
  }

  var W = canvas.width; var H = canvas.height;
  var pad = { top: 20, right: 20, bottom: 30, left: 20 };
  var plotW = W - pad.left - pad.right;
  var plotH = H - pad.top - pad.bottom;

  var minVal = centroids[0].mean;
  var maxVal = centroids[centroids.length - 1].mean;
  var range = Math.max(maxVal - minVal, 1);

  var maxCount = Math.max.apply(null, centroids.map(function(c) { return c.count; }));

  function xPos(v) { return pad.left + ((v - minVal) / range) * plotW; }

  ctx.strokeStyle = 'rgba(148,163,184,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.left, pad.top + plotH / 2); ctx.lineTo(W - pad.right, pad.top + plotH / 2); ctx.stroke();

  centroids.forEach(function(c) {
    var x = xPos(c.mean);
    var r = 2 + (c.count / maxCount) * 14;
    var y = pad.top + plotH / 2;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6,182,212,0.35)';
    ctx.fill();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });

  [0, 0.5, 0.9, 0.99, 1].forEach(function(q) {
    var v = minVal + q * range;
    var x = xPos(v);
    ctx.fillStyle = 'rgba(148,163,184,0.5)';
    ctx.font = '8px Fira Code,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('p' + Math.round(q * 100), x, H - 20);
  });
}

function tdRenderErrorChart() {
  var canvas = document.getElementById('tdErrorCanvas');
  if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 180;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (tdState.rawValues.length === 0) return;

  var sorted = tdState.rawValues.slice().sort(function(a, b) { return a - b; });
  var quantiles = [];
  for (var q = 1; q <= 99; q++) quantiles.push(q / 100);
  [0.995, 0.999].forEach(function(q) { quantiles.push(q); });

  var errors = quantiles.map(function(q) {
    var exact = tdExactPercentile(sorted, q);
    var est = tdPercentileFromCentroids(tdState.centroids, q);
    return exact > 0 ? Math.abs(est - exact) / exact * 100 : 0;
  });

  var W = canvas.width; var H = canvas.height;
  var pad = { top: 15, right: 15, bottom: 22, left: 40 };
  var plotW = W - pad.left - pad.right;
  var plotH = H - pad.top - pad.bottom;

  var maxErr = Math.max.apply(null, errors.concat([1]));

  function xPos(i) { return pad.left + (i / (quantiles.length - 1)) * plotW; }
  function yPos(e) { return pad.top + (1 - e / maxErr) * plotH; }

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (var i = 0; i <= 3; i++) {
    var y = pad.top + (i / 3) * plotH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    ctx.fillStyle = 'rgba(148,163,184,0.4)'; ctx.font = '8px Fira Code,monospace'; ctx.textAlign = 'right';
    ctx.fillText((maxErr * (1 - i / 3)).toFixed(1) + '%', pad.left - 4, y + 3);
  }

  ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
  ctx.beginPath();
  errors.forEach(function(e, i) { var x = xPos(i); var y = yPos(e); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.stroke();

  ctx.fillStyle = 'rgba(148,163,184,0.4)'; ctx.font = '8px Fira Code,monospace'; ctx.textAlign = 'center';
  ctx.fillText('percentile (p1 → p99.9)', pad.left + plotW / 2, H - 5);
}

function tdRenderPercentileTable() {
  var container = document.getElementById('tdPercentileTable');
  if (!container) return;

  if (tdState.rawValues.length === 0) {
    container.innerHTML = '<div style="font-size:0.72rem;color:rgba(148,163,184,0.35);font-style:italic">Stream values to compare.</div>';
    return;
  }

  var sorted = tdState.rawValues.slice().sort(function(a, b) { return a - b; });
  var quantiles = [0.5, 0.9, 0.95, 0.99, 0.999];

  var rows = '<div class="td-p-row td-p-head"><span>Pctl</span><span>Exact</span><span>t-Digest</span><span>Err</span></div>';

  quantiles.forEach(function(q) {
    var exact = tdExactPercentile(sorted, q);
    var est = tdPercentileFromCentroids(tdState.centroids, q);
    var err = exact > 0 ? Math.abs(est - exact) / exact * 100 : 0;
    rows += '<div class="td-p-row">' +
      '<span class="td-p-label">p' + (q * 100) + '</span>' +
      '<span class="td-p-exact">' + exact.toFixed(1) + '</span>' +
      '<span class="td-p-est">' + est.toFixed(1) + '</span>' +
      '<span class="td-p-err">' + err.toFixed(1) + '%</span>' +
    '</div>';
  });

  container.innerHTML = rows;
}

function tdRenderStats() {
  var streamedEl = document.getElementById('tdStreamed');
  var centroidCountEl = document.getElementById('tdCentroidCount');
  var memDigestEl = document.getElementById('tdMemDigest');
  var memRawEl = document.getElementById('tdMemRaw');
  var memSavingsEl = document.getElementById('tdMemSavings');

  var n = tdState.rawValues.length;
  var c = tdState.centroids.length;
  var digestBytes = c * 16;
  var rawBytes = n * 8;

  if (streamedEl) streamedEl.textContent = n.toLocaleString();
  if (centroidCountEl) centroidCountEl.textContent = c;
  if (memDigestEl) memDigestEl.textContent = digestBytes.toLocaleString() + ' bytes';
  if (memRawEl) memRawEl.textContent = rawBytes.toLocaleString() + ' bytes';
  if (memSavingsEl) {
    var pct = rawBytes > 0 ? Math.round((1 - digestBytes / rawBytes) * 100) : 0;
    memSavingsEl.textContent = rawBytes > digestBytes ? pct + '% smaller' : '—';
  }
}

function tdSetStatus(msg, cls) {
  var el = document.getElementById('tdStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'td-status ' + (cls || '');
}

function tdStream() {
  if (tdState.streaming) return;
  tdState.streaming = true;

  var target = 10000;
  var batchSize = 500;
  var added = 0;

  function batch() {
    for (var i = 0; i < batchSize && added < target; i++, added++) {
      tdState.rawValues.push(tdGenerateValue(tdState.distribution));
    }

    tdState.centroids = tdCompress(tdState.rawValues, tdState.delta);

    tdRenderCentroidCanvas();
    tdRenderStats();
    tdRenderPercentileTable();
    tdRenderErrorChart();

    tdSetStatus('Streamed ' + added.toLocaleString() + ' / ' + target.toLocaleString() + ' values. Centroids: ' + tdState.centroids.length + '.');

    if (added < target) {
      requestAnimationFrame(batch);
    } else {
      tdState.streaming = false;
      tdSetStatus('Streaming complete. ' + target.toLocaleString() + ' values compressed into ' + tdState.centroids.length + ' centroids.', 'done');
    }
  }

  batch();
}

function tdReset() {
  tdState.rawValues = [];
  tdState.centroids = [];
  tdState.streaming = false;

  tdRenderCentroidCanvas();
  tdRenderStats();
  tdRenderPercentileTable();
  tdRenderErrorChart();

  tdSetStatus('Reset. Choose a distribution and stream values to build the digest.');
}

function tdInit() {
  document.querySelectorAll('.td-dist-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.td-dist-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      tdState.distribution = btn.getAttribute('data-dist');
      tdReset();
    });
  });

  var deltaSlider = document.getElementById('tdDeltaSlider');
  if (deltaSlider) {
    deltaSlider.addEventListener('input', function() {
      tdState.delta = parseInt(deltaSlider.value);
      var lbl = document.getElementById('tdDeltaVal');
      if (lbl) lbl.textContent = tdState.delta;
      if (tdState.rawValues.length > 0) {
        tdState.centroids = tdCompress(tdState.rawValues, tdState.delta);
        tdRenderCentroidCanvas();
        tdRenderStats();
        tdRenderPercentileTable();
        tdRenderErrorChart();
      }
    });
  }

  var streamBtn = document.getElementById('tdStreamBtn');
  var resetBtn = document.getElementById('tdResetBtn');
  if (streamBtn) streamBtn.addEventListener('click', tdStream);
  if (resetBtn) resetBtn.addEventListener('click', tdReset);

  tdReset();

  window.addEventListener('resize', function() {
    tdRenderCentroidCanvas();
    tdRenderErrorChart();
  });
}