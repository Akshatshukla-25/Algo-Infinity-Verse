document.addEventListener('DOMContentLoaded', function () {
  klmInit();
});

var klmR          = 30;
var klmQ          = 2.0;
var klmN          = 50;
var klmTraj       = 'sine';
var klmAutoSpeed  = 600;
var klmAutoTimer  = null;
var klmAutoPlay   = false;
var klmCurrentStep = 0;
var klmReady      = false;
var klmLogCount   = 0;

var klmTrueVals   = [];
var klmMeasured   = [];
var klmEstimates  = [];
var klmVariances  = [];
var klmGains      = [];


function klmGenerateTrue(n, type) {
  var vals = [];
  for (var i = 0; i < n; i++) {
    var t = i / n;
    if (type === 'sine') {
      vals.push(100 + 60 * Math.sin(2 * Math.PI * t * 2));
    } else if (type === 'linear') {
      vals.push(50 + t * 100);
    } else if (type === 'step') {
      vals.push(i < n / 2 ? 80 : 140);
    } else {
      vals.push(100);
    }
  }
  return vals;
}

function klmRandNormal(mean, stddev) {
  var u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + stddev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function klmRunFilter() {
  klmTrueVals  = klmGenerateTrue(klmN, klmTraj);
  klmMeasured  = klmTrueVals.map(function (v) { return klmRandNormal(v, Math.sqrt(klmR)); });
  klmEstimates = new Array(klmN).fill(0);
  klmVariances = new Array(klmN).fill(0);
  klmGains     = new Array(klmN).fill(0);

  var x = klmMeasured[0];
  var P = klmR;

  for (var i = 0; i < klmN; i++) {
    var x_pred = x;
    var P_pred = P + klmQ;

    var z = klmMeasured[i];
    var K = P_pred / (P_pred + klmR);
    x = x_pred + K * (z - x_pred);
    P = (1 - K) * P_pred;

    klmEstimates[i] = x;
    klmVariances[i] = P;
    klmGains[i]     = K;
  }
}

function klmClearCanvas(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth   = 1;
  var gridStep = Math.round(w / 10);
  for (var x = 0; x < w; x += gridStep) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  var gridStepY = Math.round(h / 6);
  for (var y = 0; y < h; y += gridStepY) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
}

function klmRenderMainChart(upTo) {
  var canvas = document.getElementById('klmMainCanvas');
  if (!canvas) return;

  var W = canvas.parentElement ? (canvas.parentElement.clientWidth || 600) : 600;
  var H = Math.round(W * 0.38);
  H = Math.max(H, 200);
  canvas.width  = W;
  canvas.height = H;

  var ctx = canvas.getContext('2d');
  klmClearCanvas(ctx, W, H);

  if (!klmTrueVals.length) return;

  var padX = 48, padY = 20;
  var chartW = W - padX * 2;
  var chartH = H - padY * 2;

  var n    = klmTrueVals.length;
  var step = upTo !== undefined ? upTo : n - 1;

  var allVals = klmTrueVals.concat(klmMeasured).concat(klmEstimates);
  var minV = Math.min.apply(null, allVals) - 20;
  var maxV = Math.max.apply(null, allVals) + 20;
  var rng  = maxV - minV || 1;

  function tx(i) { return padX + (i / (n - 1)) * chartW; }
  function ty(v) { return padY + (1 - (v - minV) / rng) * chartH; }

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '9px Fira Code,monospace';
  ctx.textAlign = 'right';
  for (var yy = 0; yy <= 4; yy++) {
    var yv = minV + (yy / 4) * rng;
    var yp = ty(yv);
    ctx.fillText(Math.round(yv), padX - 5, yp + 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padX, yp); ctx.lineTo(W - padX, yp); ctx.stroke();
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (var xi = 0; xi <= 5; xi++) {
    var idx = Math.round(xi * (n - 1) / 5);
    ctx.fillText(idx, tx(idx), H - 5);
  }

  if (step > 0) {
    ctx.beginPath();
    for (var i = 0; i <= step; i++) {
      var sigma = Math.sqrt(klmVariances[i]);
      if (i === 0) ctx.moveTo(tx(i), ty(klmEstimates[i] + sigma));
      else         ctx.lineTo(tx(i), ty(klmEstimates[i] + sigma));
    }
    for (var j = step; j >= 0; j--) {
      var sigma2 = Math.sqrt(klmVariances[j]);
      ctx.lineTo(tx(j), ty(klmEstimates[j] - sigma2));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(6,182,212,0.12)';
    ctx.fill();

    ctx.beginPath();
    for (var ib = 0; ib <= step; ib++) {
      var s = Math.sqrt(klmVariances[ib]);
      if (ib === 0) ctx.moveTo(tx(ib), ty(klmEstimates[ib] + s));
      else          ctx.lineTo(tx(ib), ty(klmEstimates[ib] + s));
    }
    ctx.strokeStyle = 'rgba(6,182,212,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();

    ctx.beginPath();
    for (var jb = 0; jb <= step; jb++) {
      var sb = Math.sqrt(klmVariances[jb]);
      if (jb === 0) ctx.moveTo(tx(jb), ty(klmEstimates[jb] - sb));
      else          ctx.lineTo(tx(jb), ty(klmEstimates[jb] - sb));
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  for (var im = 0; im <= step; im++) {
    ctx.beginPath();
    ctx.arc(tx(im), ty(klmMeasured[im]), 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239,68,68,0.65)';
    ctx.fill();
  }

  ctx.beginPath();
  for (var it = 0; it < n; it++) {
    if (it === 0) ctx.moveTo(tx(it), ty(klmTrueVals[it]));
    else          ctx.lineTo(tx(it), ty(klmTrueVals[it]));
  }
  ctx.strokeStyle = 'rgba(34,197,94,0.5)';
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  if (step >= 0) {
    ctx.beginPath();
    for (var ik = 0; ik <= step; ik++) {
      if (ik === 0) ctx.moveTo(tx(ik), ty(klmEstimates[ik]));
      else          ctx.lineTo(tx(ik), ty(klmEstimates[ik]));
    }
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth   = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(tx(step), ty(klmEstimates[step]), 5, 0, Math.PI * 2);
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur  = 12;
    ctx.fill();
    ctx.shadowBlur  = 0;
  }

  if (step >= 0 && step < n) {
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(tx(step), padY);
    ctx.lineTo(tx(step), H - padY);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function klmRenderBell(stepIdx) {
  var canvas = document.getElementById('klmBellCanvas');
  if (!canvas) return;

  var W = canvas.parentElement ? (canvas.parentElement.clientWidth || 300) : 300;
  var H = 140;
  canvas.width  = W;
  canvas.height = H;

  var ctx = canvas.getContext('2d');
  klmClearCanvas(ctx, W, H);

  if (!klmEstimates.length || stepIdx < 0) return;

  var mu    = klmEstimates[stepIdx];
  var sigma = Math.sqrt(klmVariances[stepIdx]);
  var minX  = mu - 4 * sigma;
  var maxX  = mu + 4 * sigma;
  var rngX  = maxX - minX;

  function toX(v) { return (v - minX) / rngX * W; }

  function gauss(x) {
    var z = (x - mu) / sigma;
    return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
  }

  var peak = gauss(mu);
  var padY = 16;

  function toY(g) { return H - padY - (g / peak) * (H - padY * 2); }

  ctx.beginPath();
  for (var xi = 0; xi <= W; xi++) {
    var xv = minX + (xi / W) * rngX;
    var g  = gauss(xv);
    if (xi === 0) ctx.moveTo(xi, toY(g));
    else          ctx.lineTo(xi, toY(g));
  }
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();

  var grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,   'rgba(6,182,212,0.55)');
  grad.addColorStop(1,   'rgba(6,182,212,0.05)');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  for (var xj = 0; xj <= W; xj++) {
    var xvj = minX + (xj / W) * rngX;
    var gj  = gauss(xvj);
    if (xj === 0) ctx.moveTo(xj, toY(gj));
    else          ctx.lineTo(xj, toY(gj));
  }
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth   = 2;
  ctx.stroke();

  var mx = toX(mu);
  ctx.beginPath();
  ctx.moveTo(mx, padY);
  ctx.lineTo(mx, H - padY);
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  [mu - sigma, mu + sigma].forEach(function (xv) {
    var px = toX(xv);
    ctx.beginPath();
    ctx.moveTo(px, padY);
    ctx.lineTo(px, H - padY);
    ctx.strokeStyle = 'rgba(245,158,11,0.6)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 9px Fira Code,monospace';
  ctx.textAlign = 'center';
  ctx.fillText('μ=' + mu.toFixed(1), mx, padY - 4);

  ctx.fillStyle = 'rgba(245,158,11,0.9)';
  ctx.font = '8px Fira Code,monospace';
  ctx.fillText('±σ=' + sigma.toFixed(1), mx + 40, H / 2 + 4);
}

function klmRenderGainChart(upTo) {
  var canvas = document.getElementById('klmGainCanvas');
  if (!canvas) return;

  var W = canvas.parentElement ? (canvas.parentElement.clientWidth || 300) : 300;
  var H = 140;
  canvas.width  = W;
  canvas.height = H;

  var ctx = canvas.getContext('2d');
  klmClearCanvas(ctx, W, H);

  if (!klmGains.length) return;

  var n    = klmGains.length;
  var step = upTo !== undefined ? upTo : n - 1;
  var padX = 36, padY = 16;

  function tx(i) { return padX + (i / (n - 1)) * (W - padX - 8); }
  function ty(v) { return padY + (1 - v) * (H - padY * 2); }

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '8px Fira Code,monospace';
  ctx.textAlign = 'right';
  [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
    var yp = ty(v);
    ctx.fillText(v.toFixed(2), padX - 3, yp + 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padX, yp); ctx.lineTo(W - 8, yp); ctx.stroke();
  });

  ctx.beginPath();
  for (var i = 0; i <= step; i++) {
    if (i === 0) ctx.moveTo(tx(i), ty(klmGains[i]));
    else         ctx.lineTo(tx(i), ty(klmGains[i]));
  }
  ctx.lineTo(tx(step), H - padY);
  ctx.lineTo(tx(0), H - padY);
  ctx.closePath();
  var gg = ctx.createLinearGradient(0, 0, 0, H);
  gg.addColorStop(0, 'rgba(34,197,94,0.35)');
  gg.addColorStop(1, 'rgba(34,197,94,0.04)');
  ctx.fillStyle = gg;
  ctx.fill();

  ctx.beginPath();
  for (var j = 0; j <= step; j++) {
    if (j === 0) ctx.moveTo(tx(j), ty(klmGains[j]));
    else         ctx.lineTo(tx(j), ty(klmGains[j]));
  }
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth   = 2;
  ctx.stroke();

  if (step >= 0) {
    ctx.beginPath();
    ctx.arc(tx(step), ty(klmGains[step]), 4, 0, Math.PI * 2);
    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur  = 10;
    ctx.fill();
    ctx.shadowBlur  = 0;

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 9px Fira Code,monospace';
    ctx.textAlign = 'center';
    ctx.fillText('K=' + klmGains[step].toFixed(3), tx(step), padY - 4);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '9px Poppins,sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Kalman Gain K', padX + 4, padY + 10);
}

function klmUpdateEquations(step) {
  if (step < 0 || step >= klmN) return;

  var xpred  = step > 0 ? klmEstimates[step - 1] : klmMeasured[0];
  var ppred  = (step > 0 ? klmVariances[step - 1] : klmR) + klmQ;
  var z      = klmMeasured[step];
  var K      = klmGains[step];
  var xpost  = klmEstimates[step];
  var ppost  = klmVariances[step];

  function set(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  set('klmEqXpred', xpred.toFixed(2));
  set('klmEqPpred', ppred.toFixed(2) + '  (P_prev + Q)');
  set('klmEqZ',     z.toFixed(2) + '  (noisy sensor)');
  set('klmEqK',     K.toFixed(4) + '  = P⁻/(P⁻+R)');
  set('klmEqXpost', xpost.toFixed(2) + '  = x̂⁻ + K·(z − x̂⁻)');
  set('klmEqPpost', ppost.toFixed(2) + '  = (1−K)·P⁻');
}

function klmUpdateStats(step) {
  function set(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  if (step < 0 || step >= klmN) {
    set('klmMetStep', '—');
    set('klmMetK', '—');
    set('klmMetP', '—');
    set('klmMetErr', '—');
    set('klmMetSErr', '—');
    set('klmMetR', klmR);
    return;
  }

  var kalmErr   = Math.abs(klmEstimates[step] - klmTrueVals[step]).toFixed(2);
  var sensorErr = Math.abs(klmMeasured[step]  - klmTrueVals[step]).toFixed(2);

  set('klmMetStep', step + 1);
  set('klmMetK',    klmGains[step].toFixed(4));
  set('klmMetP',    klmVariances[step].toFixed(2));
  set('klmMetErr',  kalmErr);
  set('klmMetSErr', sensorErr);
  set('klmMetR',    klmR);
}

function klmAddLog(msg, type) {
  var log = document.getElementById('klmLog');
  if (!log) return;
  var empty = log.querySelector('.klm-empty-text');
  if (empty) empty.remove();

  var entry = document.createElement('div');
  entry.className = 'klm-log-entry log-' + (type || 'info');
  entry.textContent = '[' + (++klmLogCount) + '] ' + msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 80) log.removeChild(log.lastChild);
}

function klmSetStatus(msg, cls) {
  var el = document.getElementById('klmStatus');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'klm-status ' + (cls || '');
}

function klmApplyStep(stepIdx) {
  klmCurrentStep = stepIdx;
  klmRenderMainChart(stepIdx);
  klmRenderBell(stepIdx);
  klmRenderGainChart(stepIdx);
  klmUpdateEquations(stepIdx);
  klmUpdateStats(stepIdx);

  var K       = klmGains[stepIdx];
  var xhat    = klmEstimates[stepIdx];
  var trueV   = klmTrueVals[stepIdx];
  var meas    = klmMeasured[stepIdx];

  klmAddLog('Predict: x̂⁻=' + (stepIdx > 0 ? klmEstimates[stepIdx-1] : meas).toFixed(2) + ' P⁻=' + (klmVariances[stepIdx] / (1 - K)).toFixed(2), 'predict');
  klmAddLog('Update:  z=' + meas.toFixed(2) + ' K=' + K.toFixed(4) + ' → x̂=' + xhat.toFixed(2) + ' err=' + Math.abs(xhat - trueV).toFixed(2), 'update');

  var counter = document.getElementById('klmStepCounter');
  if (counter) counter.textContent = 'Step ' + (stepIdx + 1) + ' / ' + klmN;

  klmSetStatus(
    'Step ' + (stepIdx + 1) + '/' + klmN + ' — K=' + K.toFixed(4) +
    ' (' + (K < 0.3 ? 'trusting prediction' : K > 0.7 ? 'trusting sensor' : 'balanced') + ')' +
    ' · Kalman error: ' + Math.abs(xhat - trueV).toFixed(2) +
    ' · Sensor error: ' + Math.abs(meas - trueV).toFixed(2),
    'info'
  );
}

function klmStepForward() {
  if (!klmReady) return;
  if (klmCurrentStep < klmN - 1) {
    klmApplyStep(klmCurrentStep + 1);
  } else {
    klmStopAuto();
    klmSetStatus('Simulation complete! Kalman estimate consistently outperforms raw sensor readings.', 'ok');
  }
}

function klmStartAuto() {
  if (klmAutoPlay || !klmReady) return;
  klmAutoPlay = true;
  var btn = document.getElementById('klmAutoBtn');
  if (btn) btn.innerHTML = '<i class="fas fa-pause"></i> Pause';

  klmAutoTimer = setInterval(function () {
    if (klmCurrentStep >= klmN - 1) { klmStopAuto(); return; }
    klmStepForward();
  }, klmAutoSpeed);
}

function klmStopAuto() {
  klmAutoPlay = false;
  clearInterval(klmAutoTimer);
  var btn = document.getElementById('klmAutoBtn');
  if (btn) btn.innerHTML = '<i class="fas fa-forward"></i> Auto-Play';
}

function klmToggleAuto() {
  if (klmAutoPlay) klmStopAuto();
  else klmStartAuto();
}

function klmRun() {
  klmStopAuto();
  klmLogCount    = 0;
  klmCurrentStep = 0;
  klmReady       = false;

  var log = document.getElementById('klmLog');
  if (log) log.innerHTML = '<span class="klm-empty-text">Steps appear here during simulation.</span>';

  klmRunFilter();
  klmReady = true;

  var stepBtn = document.getElementById('klmStepBtn');
  var autoBtn = document.getElementById('klmAutoBtn');
  if (stepBtn) stepBtn.disabled = false;
  if (autoBtn) autoBtn.disabled = false;

  klmApplyStep(0);
  klmSetStatus('Simulation ready — ' + klmN + ' steps generated. Use Step or Auto-Play to walk through the filter.', 'purple');
}

function klmReset() {
  klmStopAuto();
  klmReady       = false;
  klmCurrentStep = 0;
  klmTrueVals    = [];
  klmMeasured    = [];
  klmEstimates   = [];
  klmVariances   = [];
  klmGains       = [];
  klmLogCount    = 0;

  var stepBtn = document.getElementById('klmStepBtn');
  var autoBtn = document.getElementById('klmAutoBtn');
  if (stepBtn) stepBtn.disabled = true;
  if (autoBtn) autoBtn.disabled = true;

  var log = document.getElementById('klmLog');
  if (log) log.innerHTML = '<span class="klm-empty-text">Steps appear here during simulation.</span>';

  var fpDetail = document.getElementById('klmFpDetail');
  if (fpDetail) fpDetail.innerHTML = '<span class="klm-empty-text">Run an operation to see details.</span>';

  ['klmMainCanvas', 'klmBellCanvas', 'klmGainCanvas'].forEach(function (id) {
    var c = document.getElementById(id);
    if (!c) return;
    var parent = c.parentElement;
    var w = parent ? (parent.clientWidth || 600) : 600;
    var h = id === 'klmMainCanvas' ? Math.max(Math.round(w * 0.38), 200) : 140;
    c.width  = w;
    c.height = h;
    var ctx = c.getContext('2d');
    klmClearCanvas(ctx, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = '13px Poppins,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Run simulation to see chart', w / 2, h / 2);
  });

  ['klmEqXpred','klmEqPpred','klmEqZ','klmEqK','klmEqXpost','klmEqPpost'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = '—';
  });

  klmUpdateStats(-1);
  klmSetStatus('Reset. Configure and run a new simulation.', 'purple');
}

function klmInit() {
  ['klmMainCanvas', 'klmBellCanvas', 'klmGainCanvas'].forEach(function (id) {
    var c = document.getElementById(id);
    if (!c) return;
    var parent = c.parentElement;
    var w = parent ? (parent.clientWidth || 600) : 600;
    var h = id === 'klmMainCanvas' ? Math.max(Math.round(w * 0.38), 200) : 140;
    c.width  = w;
    c.height = h;
    var ctx = c.getContext('2d');
    klmClearCanvas(ctx, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = '13px Poppins,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Run simulation to see chart', w / 2, h / 2);
  });

  klmUpdateStats(-1);

  var snEl  = document.getElementById('klmSensorNoise');
  var snVal = document.getElementById('klmSensorNoiseVal');
  if (snEl) {
    snEl.addEventListener('input', function () {
      klmR = parseFloat(snEl.value);
      if (snVal) snVal.textContent = klmR;
    });
  }

  var pnEl  = document.getElementById('klmProcessNoise');
  var pnVal = document.getElementById('klmProcessNoiseVal');
  if (pnEl) {
    pnEl.addEventListener('input', function () {
      klmQ = parseFloat(pnEl.value);
      if (pnVal) pnVal.textContent = parseFloat(klmQ).toFixed(1);
    });
  }

  var nsEl  = document.getElementById('klmSteps');
  var nsVal = document.getElementById('klmStepsVal');
  if (nsEl) {
    nsEl.addEventListener('input', function () {
      klmN = parseInt(nsEl.value, 10);
      if (nsVal) nsVal.textContent = klmN;
    });
  }

  var asEl = document.getElementById('klmAutoSpeed');
  if (asEl) {
    asEl.addEventListener('input', function () {
      klmAutoSpeed = parseInt(asEl.value, 10);
      if (klmAutoPlay) { klmStopAuto(); klmStartAuto(); }
    });
  }

  var trajSeg = document.getElementById('klmTrajSeg');
  if (trajSeg) {
    trajSeg.querySelectorAll('.klm-seg-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        trajSeg.querySelectorAll('.klm-seg-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        klmTraj = btn.getAttribute('data-traj');
      });
    });
  }

  var runBtn   = document.getElementById('klmRunBtn');
  var stepBtn  = document.getElementById('klmStepBtn');
  var autoBtn  = document.getElementById('klmAutoBtn');
  var resetBtn = document.getElementById('klmResetBtn');

  if (runBtn)   runBtn.addEventListener('click',   klmRun);
  if (stepBtn)  stepBtn.addEventListener('click',  function () { klmStopAuto(); klmStepForward(); });
  if (autoBtn)  autoBtn.addEventListener('click',  klmToggleAuto);
  if (resetBtn) resetBtn.addEventListener('click', klmReset);

  window.addEventListener('resize', function () {
    if (klmReady && klmTrueVals.length) {
      klmRenderMainChart(klmCurrentStep);
      klmRenderBell(klmCurrentStep);
      klmRenderGainChart(klmCurrentStep);
    } else {
      ['klmMainCanvas','klmBellCanvas','klmGainCanvas'].forEach(function (id) {
        var c = document.getElementById(id);
        if (!c) return;
        var parent = c.parentElement;
        var w = parent ? (parent.clientWidth || 600) : 600;
        var h = id === 'klmMainCanvas' ? Math.max(Math.round(w * 0.38), 200) : 140;
        c.width  = w;
        c.height = h;
        var ctx = c.getContext('2d');
        klmClearCanvas(ctx, w, h);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.font = '13px Poppins,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Run simulation to see chart', w / 2, h / 2);
      });
    }
  });
}