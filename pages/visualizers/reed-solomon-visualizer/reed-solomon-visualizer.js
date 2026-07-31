document.addEventListener('DOMContentLoaded', function() {
  rsInit();
});

var RS_P = 257;

function rsMod(a, m) { return ((a % m) + m) % m; }
function rsModInverse(a, m) {
  a = rsMod(a, m);
  for (var x = 1; x < m; x++) if (rsMod(a * x, m) === 1) return x;
  return null;
}
function rsLagrangeAt(points, xEval) {
  var result = 0;
  var k = points.length;
  for (var i = 0; i < k; i++) {
    var xi = points[i].x, yi = points[i].y;
    var num = 1, den = 1;
    for (var j = 0; j < k; j++) {
      if (j === i) continue;
      var xj = points[j].x;
      num = rsMod(num * rsMod(xEval - xj, RS_P), RS_P);
      den = rsMod(den * rsMod(xi - xj, RS_P), RS_P);
    }
    var term = rsMod(rsMod(yi * num, RS_P) * rsModInverse(den, RS_P), RS_P);
    result = rsMod(result + term, RS_P);
  }
  return result;
}

var rsState = { K: 4, M: 2, points: [], failed: {}, message: 'RAID' };

function rsEncode(message, M) {
  var dataVals = message.split('').map(function(ch) { return ch.charCodeAt(0) % RS_P; });
  var K = dataVals.length;
  var dataPoints = dataVals.map(function(v, i) { return { x: i + 1, y: v, isData: true, idx: i }; });
  var parityPoints = [];
  for (var x = K + 1; x <= K + M; x++) {
    parityPoints.push({ x: x, y: rsLagrangeAt(dataPoints, x), isData: false, idx: x - K - 1 });
  }
  return { K: K, M: M, points: dataPoints.concat(parityPoints), message: message };
}

function rsDecode(survivingPoints, K) {
  if (survivingPoints.length < K) return null;
  var chosen = survivingPoints.slice(0, K);
  var recovered = [];
  for (var x = 1; x <= K; x++) recovered.push(rsLagrangeAt(chosen, x));
  return recovered;
}

function rsRenderDiskArray() {
  var container = document.getElementById('rsDiskArray');
  if (!container) return;
  container.innerHTML = rsState.points.map(function(p) {
    var isDead = rsState.failed[p.x];
    var cls = 'rs-disk' + (p.isData ? '' : ' parity') + (isDead ? ' dead' : '');
    var label = p.isData ? 'D' + (p.idx + 1) : 'P' + (p.idx + 1);
    return '<div class="' + cls + '" data-x="' + p.x + '">' +
      '<i class="fas fa-skull rs-disk-icon"></i>' +
      '<span class="rs-disk-label">' + label + '</span>' +
      '<span class="rs-disk-val">' + p.y + '</span>' +
    '</div>';
  }).join('');

  container.querySelectorAll('.rs-disk').forEach(function(el) {
    el.addEventListener('click', function() { rsToggleDisk(parseInt(this.getAttribute('data-x'))); });
  });
}

function rsToggleDisk(x) {
  var point = rsState.points.find(function(p) { return p.x === x; });
  if (!point) return;

  if (rsState.failed[x]) {
    delete rsState.failed[x];
    rsAddLog('Disk ' + (point.isData ? 'D' + (point.idx + 1) : 'P' + (point.idx + 1)) + ' restored.', '');
  } else {
    rsState.failed[x] = true;
    rsAddLog('Disk ' + (point.isData ? 'D' + (point.idx + 1) : 'P' + (point.idx + 1)) + ' failed.', 'kill');
  }

  rsRenderDiskArray();
  rsUpdateTolerance();
  rsDrawCurve(false);

  var deadEl = container_findDead();
  if (deadEl) deadEl.classList.add('dead');
}

function container_findDead() { return null; }

function rsUpdateTolerance() {
  var deadCount = Object.keys(rsState.failed).length;
  var toleranceEl = document.getElementById('rsToleranceBig');
  if (toleranceEl) {
    toleranceEl.textContent = deadCount + ' / ' + rsState.M;
    toleranceEl.className = 'rs-tolerance-big' + (deadCount > rsState.M ? ' critical' : deadCount === rsState.M ? ' warn' : '');
  }
}

function rsAddLog(msg, cls) {
  var log = document.getElementById('rsLog');
  if (!log) return;
  var empty = log.querySelector('.rs-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'rs-log-entry ' + (cls || '');
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 60) log.removeChild(log.lastChild);
}

function rsSetStatus(msg, cls) {
  var el = document.getElementById('rsStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'rs-status ' + (cls || '');
}

function rsDrawCurve(highlightRecovered, recoveredVals) {
  var canvas = document.getElementById('rsCurveCanvas');
  if (!canvas || rsState.points.length === 0) return;
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 320;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var W = canvas.width; var H = canvas.height;
  var pad = { top: 30, right: 30, bottom: 40, left: 40 };
  var plotW = W - pad.left - pad.right;
  var plotH = H - pad.top - pad.bottom;

  var maxX = rsState.K + rsState.M + 1;
  var maxY = RS_P;

  function xPos(x) { return pad.left + (x / maxX) * plotW; }
  function yPos(y) { return pad.top + (1 - y / maxY) * plotH; }

  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (var gx = 1; gx <= maxX - 1; gx++) {
    ctx.beginPath(); ctx.moveTo(xPos(gx), pad.top); ctx.lineTo(xPos(gx), H - pad.bottom); ctx.stroke();
  }

  var surviving = rsState.points.filter(function(p) { return !rsState.failed[p.x]; });

  if (surviving.length >= rsState.K) {
    var curvePoints = surviving.slice(0, rsState.K);
    ctx.strokeStyle = 'rgba(6,182,212,0.55)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var px = 0.5; px <= maxX - 0.5; px += 0.25) {
      var py = rsLagrangeAt(curvePoints, Math.round(px * 100) / 100 % RS_P);
      var x = xPos(px); var y = yPos(py);
      if (px === 0.5) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(239,68,68,0.5)';
    ctx.font = 'bold 13px Poppins,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Fewer than K surviving points — curve cannot be determined', W / 2, H / 2);
  }

  rsState.points.forEach(function(p) {
    var isDead = rsState.failed[p.x];
    var x = xPos(p.x); var y = yPos(p.y);
    var color = p.isData ? '#06b6d4' : '#a855f7';

    if (isDead) {
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(239,68,68,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
      return;
    }

    var glowIsRecovered = highlightRecovered && recoveredVals !== undefined;

    ctx.beginPath();
    ctx.arc(x, y, glowIsRecovered ? 8 : 6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.fillStyle = 'rgba(203,213,225,0.7)';
    ctx.font = '9px Fira Code,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText((p.isData ? 'D' : 'P') + (p.idx + 1), x, y - 12);
  });

  ctx.fillStyle = 'rgba(148,163,184,0.4)'; ctx.font = '9px Fira Code,monospace'; ctx.textAlign = 'center';
  ctx.fillText('x (disk position)', pad.left + plotW / 2, H - 10);
}

function rsEncodeHandler() {
  var input = document.getElementById('rsMessageInput');
  var msg = (input ? input.value : '').trim();
  if (!msg) { rsSetStatus('Enter a message to encode.', ''); return; }
  if (msg.length > 6) { rsSetStatus('Keep messages to 6 characters for a readable array.', ''); return; }

  var encoded = rsEncode(msg, rsState.M);
  rsState.K = encoded.K;
  rsState.points = encoded.points;
  rsState.failed = {};
  rsState.message = msg;

  var log = document.getElementById('log');
  var logEl = document.getElementById('rsLog');
  if (logEl) logEl.innerHTML = '<div class="rs-empty">No activity yet.</div>';

  rsRenderDiskArray();
  rsUpdateTolerance();
  rsDrawCurve(false);

  var resultEl = document.getElementById('rsResultDisplay');
  if (resultEl) { resultEl.textContent = msg; resultEl.className = 'rs-result-display'; }

  rsSetStatus('Encoded "' + msg + '" into ' + rsState.K + ' data disk(s) + ' + rsState.M + ' parity disk(s). Any ' + rsState.M + ' can fail with zero loss.', 'good');
}

function rsReconstructHandler() {
  if (rsState.points.length === 0) { rsSetStatus('Encode a message first.', ''); return; }

  var surviving = rsState.points.filter(function(p) { return !rsState.failed[p.x]; });
  var resultEl = document.getElementById('rsResultDisplay');
  var deadCount = Object.keys(rsState.failed).length;

  if (surviving.length < rsState.K) {
    if (resultEl) { resultEl.textContent = 'INSUFFICIENT SURVIVORS — ' + surviving.length + ' of ' + rsState.K + ' needed'; resultEl.className = 'rs-result-display impossible'; }
    rsAddLog('Reconstruction FAILED — only ' + surviving.length + ' surviving disks, need at least ' + rsState.K + '. Mathematically impossible, not just difficult.', 'fail');
    rsSetStatus(deadCount + ' disk(s) failed — exceeds tolerance of ' + rsState.M + '. Reconstruction is genuinely impossible.', 'fail');
    return;
  }

  var recovered = rsDecode(surviving, rsState.K);
  var recoveredMsg = recovered.map(function(v) { return String.fromCharCode(v); }).join('');

  if (resultEl) { resultEl.textContent = recoveredMsg; resultEl.className = 'rs-result-display success'; }

  document.querySelectorAll('.rs-disk.dead').forEach(function(el) {
    el.classList.remove('dead');
    el.classList.add('recovered');
    setTimeout(function() { el.classList.remove('recovered'); }, 900);
  });

  setTimeout(function() { rsRenderDiskArray(); }, 950);

  rsDrawCurve(true, recovered);
  rsAddLog('Reconstruction SUCCESS — recovered "' + recoveredMsg + '" from ' + surviving.length + ' of ' + (rsState.K + rsState.M) + ' disks via Lagrange interpolation.', 'good');
  rsSetStatus('Reconstructed exactly "' + recoveredMsg + '" using only ' + surviving.length + ' surviving disk(s).', 'good');
}

function rsOneOverHandler() {
  if (rsState.points.length === 0) { rsSetStatus('Encode a message first.', ''); return; }

  rsState.failed = {};
  var toFail = rsState.M + 1;
  var shuffled = rsState.points.slice().sort(function() { return Math.random() - 0.5; });
  for (var i = 0; i < toFail && i < shuffled.length; i++) rsState.failed[shuffled[i].x] = true;

  rsRenderDiskArray();
  rsUpdateTolerance();
  rsDrawCurve(false);
  rsAddLog('Deliberately failed ' + toFail + ' disks (M+1) — one more than tolerable.', 'kill');
  rsSetStatus(toFail + ' disks failed — one beyond the tolerance of ' + rsState.M + '. Click Reconstruct to see it fail correctly.', 'fail');
}

function rsInit() {
  document.querySelectorAll('.rs-m-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.rs-m-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      rsState.M = parseInt(btn.getAttribute('data-m'));
      rsEncodeHandler();
    });
  });

  var encodeBtn = document.getElementById('rsEncodeBtn');
  var reconstructBtn = document.getElementById('rsReconstructBtn');
  var oneOverBtn = document.getElementById('rsOneOverBtn');
  if (encodeBtn) encodeBtn.addEventListener('click', rsEncodeHandler);
  if (reconstructBtn) reconstructBtn.addEventListener('click', rsReconstructHandler);
  if (oneOverBtn) oneOverBtn.addEventListener('click', rsOneOverHandler);

  var msgInput = document.getElementById('rsMessageInput');
  if (msgInput) msgInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') rsEncodeHandler(); });

  rsEncodeHandler();
  rsInitHeroCanvas();

  window.addEventListener('resize', function() { rsDrawCurve(false); });
}

function rsInitHeroCanvas() {
  var canvas = document.getElementById('rsHeroCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var t = 0;

  function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    var W = canvas.width; var H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    t += 0.008;

    for (var layer = 0; layer < 3; layer++) {
      ctx.strokeStyle = layer === 0 ? 'rgba(6,182,212,0.15)' : layer === 1 ? 'rgba(168,85,247,0.12)' : 'rgba(34,197,94,0.1)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (var x = 0; x <= W; x += 4) {
        var y = H / 2 + Math.sin(x * 0.008 + t + layer * 2) * (40 + layer * 20) + Math.sin(x * 0.02 - t * 1.5) * 15;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    requestAnimationFrame(draw);
  }
  draw();
}