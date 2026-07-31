document.addEventListener('DOMContentLoaded', function () {
  ckfInit();
});


var CKF_MAX_KICKS = 500;

var ckfNumBuckets  = 16;
var ckfSlotsPerBkt = 4;
var ckfFpBits      = 8;
var ckfBuckets     = [];   
var ckfItemCount   = 0;
var ckfEvictions   = 0;
var ckfFalsePos    = 0;
var ckfInserted    = {};   
var ckfLogCount    = 0;
var ckfHighlight   = {};   
var ckfHighlightTimer = null;


function ckfHashStr(str, seed) {
  var h = (seed || 0x9e3779b9) >>> 0;
  for (var i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x9e3779b9);
    h = ((h << 13) | (h >>> 19)) >>> 0;
  }
  return h;
}

function ckfFingerprint(item) {
  var mask = (1 << ckfFpBits) - 1;
  var fp   = ckfHashStr(item, 0xdeadbeef) & mask;
  return fp === 0 ? 1 : fp;  
}

function ckfHashFp(fp) {
  var h = ckfHashStr(String(fp), 0xcafebabe);
  return h;
}

function ckfBucket1(item) {
  return ckfHashStr(item, 0x12345678) % ckfNumBuckets;
}

function ckfBucket2(b1, fp) {
  var b2 = (b1 ^ ckfHashFp(fp)) % ckfNumBuckets;
  if (b2 < 0) b2 = (b2 + ckfNumBuckets) % ckfNumBuckets;
  return b2;
}


function ckfRebuildFilter() {
  ckfBuckets = [];
  for (var i = 0; i < ckfNumBuckets; i++) {
    var slots = [];
    for (var s = 0; s < ckfSlotsPerBkt; s++) slots.push(null);
    ckfBuckets.push(slots);
  }
}

function ckfSlotsFree(bIdx) {
  for (var s = 0; s < ckfSlotsPerBkt; s++) {
    if (ckfBuckets[bIdx][s] === null) return true;
  }
  return false;
}

function ckfPlaceInBucket(bIdx, fp) {
  for (var s = 0; s < ckfSlotsPerBkt; s++) {
    if (ckfBuckets[bIdx][s] === null) {
      ckfBuckets[bIdx][s] = fp;
      return true;
    }
  }
  return false;
}

function ckfInsert(item) {
  var fp = ckfFingerprint(item);
  var b1 = ckfBucket1(item);
  var b2 = ckfBucket2(b1, fp);

  var detail = {
    item: item,
    fp: fp,
    fpHex: '0x' + fp.toString(16).toUpperCase().padStart(2, '0'),
    b1: b1,
    b2: b2,
    evictChain: [],
    result: null
  };

  if (ckfPlaceInBucket(b1, fp)) {
    detail.result = 'placed_b1';
    ckfItemCount++;
    ckfInserted[item] = true;
    ckfHighlight = { b1: b1, b2: b2, placed: b1, evict: [] };
    ckfRenderCanvas();
    ckfUpdateStats();
    ckfRenderFpDetail(detail);
    ckfAddLog('INSERT "' + item + '" fp=' + detail.fpHex + ' → B' + b1 + ' (direct)', 'insert');
    return { ok: true, detail: detail };
  }

  if (ckfPlaceInBucket(b2, fp)) {
    detail.result = 'placed_b2';
    ckfItemCount++;
    ckfInserted[item] = true;
    ckfHighlight = { b1: b1, b2: b2, placed: b2, evict: [] };
    ckfRenderCanvas();
    ckfUpdateStats();
    ckfRenderFpDetail(detail);
    ckfAddLog('INSERT "' + item + '" fp=' + detail.fpHex + ' → B' + b2 + ' (alt)', 'insert');
    return { ok: true, detail: detail };
  }

  /* Both full — cuckoo eviction */
  var curFp  = fp;
  var curB   = Math.random() < 0.5 ? b1 : b2;

  for (var kick = 0; kick < CKF_MAX_KICKS; kick++) {
    /* evict a random occupant from curB */
    var slot = Math.floor(Math.random() * ckfSlotsPerBkt);
    var evictedFp = ckfBuckets[curB][slot];
    ckfBuckets[curB][slot] = curFp;
    ckfEvictions++;

    detail.evictChain.push({ from: curB, evictedFp: evictedFp, slot: slot });
    ckfAddLog('EVICT fp=0x' + evictedFp.toString(16).toUpperCase() + ' from B' + curB, 'evict');

    /* relocate evicted fp to its alternate bucket */
    var altB = (curB ^ ckfHashFp(evictedFp)) % ckfNumBuckets;
    if (altB < 0) altB = (altB + ckfNumBuckets) % ckfNumBuckets;

    if (ckfPlaceInBucket(altB, evictedFp)) {
      detail.result = 'eviction_success';
      ckfItemCount++;
      ckfInserted[item] = true;
      ckfHighlight = { b1: b1, b2: b2, placed: curB, evict: [altB] };
      ckfRenderCanvas();
      ckfUpdateStats();
      ckfRenderFpDetail(detail);
      return { ok: true, detail: detail };
    }

    curFp = evictedFp;
    curB  = altB;
  }

  detail.result = 'full';
  ckfRenderFpDetail(detail);
  return { ok: false, detail: detail };
}

function ckfLookup(item) {
  var fp = ckfFingerprint(item);
  var b1 = ckfBucket1(item);
  var b2 = ckfBucket2(b1, fp);

  var detail = {
    item: item,
    fp: fp,
    fpHex: '0x' + fp.toString(16).toUpperCase().padStart(2, '0'),
    b1: b1,
    b2: b2,
    foundIn: null,
    isFP: false
  };

  for (var s = 0; s < ckfSlotsPerBkt; s++) {
    if (ckfBuckets[b1][s] === fp) {
      detail.foundIn = b1;
      ckfHighlight = { b1: b1, b2: b2, found: b1, evict: [] };
      ckfRenderCanvas();
      ckfRenderFpDetail(detail);
      return { found: true, detail: detail };
    }
  }

  for (var s2 = 0; s2 < ckfSlotsPerBkt; s2++) {
    if (ckfBuckets[b2][s2] === fp) {
      detail.foundIn = b2;
      ckfHighlight = { b1: b1, b2: b2, found: b2, evict: [] };
      ckfRenderCanvas();
      ckfRenderFpDetail(detail);

      /* If the item was never truly inserted → false positive */
      if (!ckfInserted[item]) {
        detail.isFP = true;
        ckfFalsePos++;
        ckfUpdateStats();
      }
      return { found: true, detail: detail };
    }
  }

  detail.foundIn = null;
  ckfHighlight = { b1: b1, b2: b2, notfound: true, evict: [] };
  ckfRenderCanvas();
  ckfRenderFpDetail(detail);
  return { found: false, detail: detail };
}

function ckfDelete(item) {
  var fp = ckfFingerprint(item);
  var b1 = ckfBucket1(item);
  var b2 = ckfBucket2(b1, fp);

  var detail = {
    item: item,
    fp: fp,
    fpHex: '0x' + fp.toString(16).toUpperCase().padStart(2, '0'),
    b1: b1,
    b2: b2,
    deletedFrom: null
  };

  for (var s = 0; s < ckfSlotsPerBkt; s++) {
    if (ckfBuckets[b1][s] === fp) {
      ckfBuckets[b1][s] = null;
      detail.deletedFrom = b1;
      ckfItemCount = Math.max(0, ckfItemCount - 1);
      delete ckfInserted[item];
      ckfHighlight = { b1: b1, b2: b2, deleted: b1, evict: [] };
      ckfRenderCanvas();
      ckfUpdateStats();
      ckfRenderFpDetail(detail);
      ckfAddLog('DELETE "' + item + '" fp=' + detail.fpHex + ' from B' + b1, 'delete');
      return { ok: true, detail: detail };
    }
  }

  for (var s2 = 0; s2 < ckfSlotsPerBkt; s2++) {
    if (ckfBuckets[b2][s2] === fp) {
      ckfBuckets[b2][s2] = null;
      detail.deletedFrom = b2;
      ckfItemCount = Math.max(0, ckfItemCount - 1);
      delete ckfInserted[item];
      ckfHighlight = { b1: b1, b2: b2, deleted: b2, evict: [] };
      ckfRenderCanvas();
      ckfUpdateStats();
      ckfRenderFpDetail(detail);
      ckfAddLog('DELETE "' + item + '" fp=' + detail.fpHex + ' from B' + b2, 'delete');
      return { ok: true, detail: detail };
    }
  }

  ckfRenderFpDetail(detail);
  return { ok: false, detail: detail };
}

/* ════════════════════════════════════════════
   CANVAS RENDERING — Beautiful bucket grid
════════════════════════════════════════════ */

function ckfRenderCanvas() {
  var canvas = document.getElementById('ckfCanvas');
  if (!canvas) return;

  var wrap = canvas.parentElement;
  var maxW = wrap ? (wrap.clientWidth || 600) : 600;

  var B      = ckfNumBuckets;
  var S      = ckfSlotsPerBkt;
  var padX   = 56;
  var padY   = 30;
  var gap    = 6;
  var cellW  = Math.max(38, Math.floor((maxW - padX * 2 - gap * (S - 1)) / (B > 16 ? B / 2 : B) - gap));
  var cellH  = 32;
  var cols   = B <= 16 ? B : Math.ceil(B / 2);
  var rows   = B <= 16 ? 1 : 2;
  var colW   = cellW + gap;
  var rowH   = (cellH + gap) * S + gap * 3 + 16;

  var W = padX * 2 + cols * colW - gap + 4;
  var H = padY + rows * rowH + 20;

  canvas.width  = W;
  canvas.height = H;

  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  /* Background */
  var bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, 'rgba(10,10,26,0.95)');
  bg.addColorStop(1, 'rgba(20,10,40,0.95)');
  ctx.fillStyle = bg;
  ctx.roundRect ? ctx.roundRect(0, 0, W, H, 12) : ctx.fillRect(0, 0, W, H);
  ctx.fill();

  var hl = ckfHighlight;

  for (var b = 0; b < B; b++) {
    var col = b % cols;
    var row = Math.floor(b / cols);
    var bx  = padX + col * colW;
    var by  = padY + row * rowH;

    var isB1      = hl.b1 === b;
    var isB2      = hl.b2 === b;
    var isPlaced  = hl.placed === b;
    var isFound   = hl.found === b;
    var isDeleted = hl.deleted === b;
    var isEvict   = hl.evict && hl.evict.indexOf(b) > -1;
    var isNotFound = hl.notfound && (isB1 || isB2);

    /* Bucket header */
    var headerCol = 'rgba(255,255,255,0.06)';
    if (isPlaced)  headerCol = 'rgba(168,85,247,0.3)';
    if (isFound)   headerCol = 'rgba(34,197,94,0.25)';
    if (isDeleted) headerCol = 'rgba(239,68,68,0.25)';
    if (isEvict)   headerCol = 'rgba(245,158,11,0.25)';
    if (isNotFound) headerCol = 'rgba(239,68,68,0.12)';
    if (isB1 && !isPlaced && !isFound && !isDeleted) headerCol = 'rgba(6,182,212,0.18)';
    if (isB2 && !isPlaced && !isFound && !isDeleted) headerCol = 'rgba(16,185,129,0.18)';

    /* Bucket background */
    var bktH = S * (cellH + gap) + gap;
    ctx.fillStyle = headerCol;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(bx - 3, by, cellW + 6, bktH + 18, 8);
    } else {
      ctx.rect(bx - 3, by, cellW + 6, bktH + 18);
    }
    ctx.fill();

    /* Bucket glow for active */
    if (isPlaced || isFound || isDeleted || isEvict) {
      var glowCol = isPlaced ? '#a855f7' : (isFound ? '#22c55e' : (isDeleted ? '#ef4444' : '#f59e0b'));
      ctx.shadowColor = glowCol;
      ctx.shadowBlur  = 14;
      ctx.strokeStyle = glowCol;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(bx - 3, by, cellW + 6, bktH + 18, 8);
      } else {
        ctx.rect(bx - 3, by, cellW + 6, bktH + 18);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    /* Bucket label */
    ctx.fillStyle = (isB1 ? '#06b6d4' : (isB2 ? '#10b981' : 'rgba(255,255,255,0.4)'));
    ctx.font = 'bold 9px Fira Code,monospace';
    ctx.textAlign = 'center';
    ctx.fillText('B' + b, bx + cellW / 2, by + 11);

    /* Slots */
    for (var s = 0; s < S; s++) {
      var sy   = by + 16 + s * (cellH + gap);
      var fp   = ckfBuckets[b][s];
      var isEmpty = fp === null;

      var cellBg;
      if (isEmpty) {
        cellBg = 'rgba(255,255,255,0.04)';
      } else {
        var t = fp / ((1 << ckfFpBits) - 1);
        var r = Math.round(80 + t * 80);
        var g = Math.round(20 + t * 60);
        var bl = Math.round(140 + t * 115);
        cellBg = 'rgba(' + r + ',' + g + ',' + bl + ',0.55)';
      }

      if (!isEmpty && (isPlaced || isFound || isEvict || isDeleted)) {
        if (isPlaced)  cellBg = 'rgba(168,85,247,0.55)';
        if (isFound)   cellBg = 'rgba(34,197,94,0.55)';
        if (isDeleted) cellBg = 'rgba(239,68,68,0.45)';
        if (isEvict)   cellBg = 'rgba(245,158,11,0.45)';
      }

      ctx.fillStyle = cellBg;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(bx, sy, cellW, cellH, 5);
      } else {
        ctx.rect(bx, sy, cellW, cellH);
      }
      ctx.fill();

      /* Slot border */
      ctx.strokeStyle = isEmpty ? 'rgba(255,255,255,0.07)' : 'rgba(168,85,247,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      /* Fingerprint text */
      if (!isEmpty) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px Fira Code,monospace';
        ctx.textAlign = 'center';
        ctx.fillText('0x' + fp.toString(16).toUpperCase().padStart(2, '0'), bx + cellW / 2, sy + cellH / 2 + 4);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.font = '9px Fira Code,monospace';
        ctx.textAlign = 'center';
        ctx.fillText('—', bx + cellW / 2, sy + cellH / 2 + 4);
      }
    }
  }

  /* XOR arrow between highlighted b1 and b2 */
  if (hl.b1 !== undefined && hl.b2 !== undefined && hl.b1 !== hl.b2) {
    var c1 = hl.b1 % cols, r1 = Math.floor(hl.b1 / cols);
    var c2 = hl.b2 % cols, r2 = Math.floor(hl.b2 / cols);
    var x1 = padX + c1 * colW + cellW / 2;
    var y1 = padY + r1 * rowH + 16 + S * (cellH + gap) / 2;
    var x2 = padX + c2 * colW + cellW / 2;
    var y2 = padY + r2 * rowH + 16 + S * (cellH + gap) / 2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'rgba(168,85,247,0.4)';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    /* XOR label midpoint */
    var mx = (x1 + x2) / 2;
    var my = (y1 + y2) / 2;
    ctx.fillStyle = 'rgba(20,10,40,0.85)';
    ctx.beginPath();
    ctx.arc(mx, my, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 10px Fira Code,monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⊕', mx, my + 4);
  }
}


function ckfUpdateStats() {
  var total    = ckfNumBuckets * ckfSlotsPerBkt;
  var loadPct  = total > 0 ? Math.round((ckfItemCount / total) * 100) : 0;

  var elItems  = document.getElementById('ckfStatItems');
  var elLoad   = document.getElementById('ckfStatLoad');
  var elEvict  = document.getElementById('ckfStatEvict');
  var elFP     = document.getElementById('ckfStatFP');
  var loadBar  = document.getElementById('ckfLoadBar');

  if (elItems) elItems.textContent = ckfItemCount;
  if (elLoad)  elLoad.textContent  = loadPct + '%';
  if (elEvict) elEvict.textContent = ckfEvictions;
  if (elFP)    elFP.textContent    = ckfFalsePos;

  if (loadBar) {
    loadBar.style.width = loadPct + '%';
    loadBar.classList.toggle('overloaded', loadPct >= 90);
  }
}


function ckfEsc(str) {
  var d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

function ckfRenderFpDetail(detail) {
  var el = document.getElementById('ckfFpDetail');
  if (!el) return;

  var foundTxt  = detail.foundIn !== null ? detail.foundIn : '—';
  var deletedTxt = detail.deletedFrom !== null ? detail.deletedFrom : '—';

  var rows = [
    { k: 'Item',        v: '"' + ckfEsc(detail.item) + '"',  cls: '' },
    { k: 'Fingerprint', v: detail.fpHex + ' (' + ckfFpBits + '-bit)', cls: '' },
    { k: 'Bucket 1 (h₁)',   v: 'B' + detail.b1,  cls: 'bucket1' },
    { k: 'Bucket 2 (h₁⊕h(fp))', v: 'B' + detail.b2, cls: 'bucket2' }
  ];

  if (detail.result === 'placed_b1') rows.push({ k: 'Placed in', v: 'B' + detail.b1 + ' (direct)', cls: 'found' });
  if (detail.result === 'placed_b2') rows.push({ k: 'Placed in', v: 'B' + detail.b2 + ' (alternate)', cls: 'found' });
  if (detail.result === 'eviction_success') rows.push({ k: 'Placed after', v: detail.evictChain.length + ' eviction(s)', cls: 'found' });
  if (detail.result === 'full') rows.push({ k: 'Result', v: 'FILTER FULL', cls: 'notfound' });
  if (detail.foundIn !== null) rows.push({ k: 'Found in', v: 'B' + detail.foundIn + (detail.isFP ? ' (FALSE POSITIVE!)' : ''), cls: detail.isFP ? 'notfound' : 'found' });
  if (detail.foundIn === null && detail.deletedFrom === null && detail.result === undefined) rows.push({ k: 'Found', v: 'NOT FOUND', cls: 'notfound' });
  if (detail.deletedFrom !== null) rows.push({ k: 'Deleted from', v: 'B' + detail.deletedFrom, cls: 'found' });
  if (detail.deletedFrom === null && detail.fp !== undefined && detail.result === undefined && detail.foundIn === null) rows.push({ k: 'Delete result', v: 'Not found', cls: 'notfound' });

  var html = rows.map(function (r) {
    return '<div class="ckf-fp-row"><span class="ckf-fp-key">' + r.k + '</span><span class="ckf-fp-val ' + r.cls + '">' + r.v + '</span></div>';
  }).join('');

  if (detail.isFP) {
    html += '<div class="ckf-fp-note">⚠️ False positive! The fingerprint of "' + ckfEsc(detail.item) + '" collided with a stored fingerprint in B' + detail.foundIn + '. The item was never inserted, but the filter says it might be present.</div>';
  } else if (detail.deletedFrom !== null) {
    html += '<div class="ckf-fp-note">✅ Unlike a Bloom Filter, the Cuckoo Filter can delete this fingerprint directly — no rebuild needed, no risk of false negatives for other items.</div>';
  }

  el.innerHTML = html;
}


function ckfAddLog(msg, type) {
  var log = document.getElementById('ckfLog');
  if (!log) return;
  var empty = log.querySelector('.ckf-empty-text');
  if (empty) empty.remove();

  var entry = document.createElement('div');
  entry.className = 'ckf-log-entry log-' + (type || 'info');
  entry.textContent = '[' + (++ckfLogCount) + '] ' + msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 60) log.removeChild(log.lastChild);
}

function ckfSetStatus(msg, cls) {
  var el = document.getElementById('ckfStatus');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'ckf-status ' + (cls || '');
}


function ckfShowComparison() {
  var card = document.getElementById('ckfCompareCard');
  var body = document.getElementById('ckfCompareBody');
  if (!card || !body) return;

  card.style.display = 'block';


  var n   = Math.max(ckfItemCount, 100);
  var f   = ckfFpBits;
  var B   = ckfNumBuckets;
  var S   = ckfSlotsPerBkt;
  var eps = Math.pow(2, -f);   /* approx FPR = 2·2^(-f) */

  var bloomBits = Math.ceil(-n * Math.log(eps) / (Math.LN2 * Math.LN2));
  var cuckBits  = B * S * f;

  var crossover = 2 / eps;

  var rows = [
    { label: 'n (items)', cuck: n.toString(), bloom: n.toString(), bettCol: '' },
    { label: 'FPR', cuck: (2 * Math.pow(2, -f) * 100).toFixed(3) + '%', bloom: (Math.pow(2, -f) * 100).toFixed(3) + '%', bettCol: '' },
    { label: 'Bits per item', cuck: (cuckBits / n).toFixed(1), bloom: (bloomBits / n).toFixed(1), bettCol: cuckBits < bloomBits ? 'cuckoo' : 'bloom' },
    { label: 'Total bits', cuck: cuckBits.toString(), bloom: bloomBits.toString(), bettCol: cuckBits < bloomBits ? 'cuckoo' : 'bloom' },
    { label: 'Deletion', cuck: '✅ Yes', bloom: '❌ No', bettCol: 'cuckoo' }
  ];

  var tableHtml = '<table class="ckf-compare-table"><thead><tr><th></th><th>Cuckoo Filter</th><th>Bloom Filter</th></tr></thead><tbody>';
  rows.forEach(function (r) {
    tableHtml +=
      '<tr><td>' + r.label + '</td>' +
      '<td class="' + (r.bettCol === 'cuckoo' ? 'ckf-cmp-better ckf-cmp-cuckoo' : 'ckf-cmp-cuckoo') + '">' + r.cuck + '</td>' +
      '<td class="' + (r.bettCol === 'bloom' ? 'ckf-cmp-better' : (r.bettCol === 'cuckoo' ? 'ckf-cmp-worse ckf-cmp-bloom' : 'ckf-cmp-bloom')) + '">' + r.bloom + '</td></tr>';
  });
  tableHtml += '</tbody></table>';

  var maxBits = Math.max(cuckBits, bloomBits);
  var cuckPct = Math.round((cuckBits / maxBits) * 100);
  var bloomPct = Math.round((bloomBits / maxBits) * 100);

  var chartHtml = '<div class="ckf-compare-chart-wrap">' +
    '<div class="ckf-compare-bar-row">' +
      '<div class="ckf-compare-bar-label">Cuckoo</div>' +
      '<div class="ckf-compare-bar-track"><div class="ckf-compare-bar-fill ckf-bar-cuckoo" style="width:' + cuckPct + '%">' + cuckBits + ' bits</div></div>' +
    '</div>' +
    '<div class="ckf-compare-bar-row">' +
      '<div class="ckf-compare-bar-label">Bloom</div>' +
      '<div class="ckf-compare-bar-track"><div class="ckf-compare-bar-fill ckf-bar-bloom" style="width:' + bloomPct + '%">' + bloomBits + ' bits</div></div>' +
    '</div>' +
  '</div>';

  var noteHtml = '<div class="ckf-compare-note">' +
    'With ' + f + '-bit fingerprints and ~' + n + ' items, the Cuckoo Filter uses <strong>' + cuckBits + ' bits</strong> vs Bloom\'s <strong>' + bloomBits + ' bits</strong>. ' +
    'Cuckoo filters outperform Bloom filters in space when the target FPR is below ~3% (fingerprint ≥ 5 bits). ' +
    'The crossover is approximately n=' + Math.round(crossover) + ' for this FPR.' +
  '</div>';

  body.innerHTML = tableHtml + chartHtml + noteHtml;
}


var CKF_BATCH_WORDS = [
  'alice','bob','carol','dave','eve','frank','grace','heidi',
  'ivan','judy','kevin','laura','mike','nancy','oscar','peggy',
  'romeo','sarah','trent','ursula','victor','wendy','xander','yvonne'
];

function ckfBatchInsert() {
  var inserted = 0;
  var failed   = 0;
  var n        = Math.min(12, CKF_BATCH_WORDS.length);

  for (var i = 0; i < n; i++) {
    var word = CKF_BATCH_WORDS[i];
    var r    = ckfInsert(word);
    if (r.ok) inserted++;
    else { failed++; }
  }

  ckfHighlight = {};
  ckfRenderCanvas();
  ckfUpdateStats();
  ckfAddLog('BATCH: ' + inserted + ' inserted, ' + failed + ' failed (filter full)', 'info');
  ckfSetStatus('Batch inserted ' + inserted + ' items. ' + (failed ? failed + ' item(s) failed — filter near capacity.' : ''), inserted > 0 ? 'ok' : 'fail');
}



function ckfFpDemo() {
  var candidates = ['zzz999', 'qwerty', 'xyzabc', 'foo123', 'zap999', 'unlikely_word', 'neverInserted1', 'neverInserted2'];
  var tried  = 0;
  var found  = 0;

  for (var i = 0; i < candidates.length; i++) {
    if (ckfInserted[candidates[i]]) continue;
    tried++;
    var r = ckfLookup(candidates[i]);
    if (r.found) {
      found++;
      ckfSetStatus('🚨 False positive! "' + candidates[i] + '" was never inserted, but the filter says it might be present. Fingerprint ' + r.detail.fpHex + ' collided.', 'warn');
      ckfAddLog('FALSE POSITIVE: "' + candidates[i] + '" found in B' + r.detail.foundIn, 'fp');
      return;
    }
  }

  /* Generate more queries until we find one or give up */
  for (var j = 0; j < 200; j++) {
    var probe = 'probe_' + Math.floor(Math.random() * 99999);
    if (ckfInserted[probe]) continue;
    var rr = ckfLookup(probe);
    tried++;
    if (rr.found) {
      found++;
      ckfSetStatus('🚨 False positive on "' + probe + '"! Fingerprint 0x' + rr.detail.fpHex + ' collided in B' + rr.detail.foundIn + '.', 'warn');
      ckfAddLog('FALSE POSITIVE: "' + probe + '"', 'fp');
      return;
    }
  }

  ckfSetStatus('No false positive found in ' + tried + ' probes. Load: ' + Math.round((ckfItemCount / (ckfNumBuckets * ckfSlotsPerBkt)) * 100) + '%. Insert more items to increase collision probability.', 'info');
}



function ckfReset() {
  ckfItemCount  = 0;
  ckfEvictions  = 0;
  ckfFalsePos   = 0;
  ckfInserted   = {};
  ckfHighlight  = {};
  ckfLogCount   = 0;

  ckfRebuildFilter();
  ckfRenderCanvas();
  ckfUpdateStats();

  var log = document.getElementById('ckfLog');
  if (log) log.innerHTML = '<span class="ckf-empty-text">Operations appear here.</span>';

  var fpDetail = document.getElementById('ckfFpDetail');
  if (fpDetail) fpDetail.innerHTML = '<span class="ckf-empty-text">Run an operation to see fingerprint details.</span>';

  var cmpCard = document.getElementById('ckfCompareCard');
  if (cmpCard) cmpCard.style.display = 'none';

  ckfSetStatus('Reset. Configure the filter and start inserting items.', 'purple');
}



function ckfInit() {
  ckfRebuildFilter();
  ckfRenderCanvas();
  ckfUpdateStats();

  var bktSl   = document.getElementById('ckfBucketSlider');
  var bktVal  = document.getElementById('ckfBucketVal');
  var sltSl   = document.getElementById('ckfSlotSlider');
  var sltVal  = document.getElementById('ckfSlotVal');
  var fpSl    = document.getElementById('ckfFpSlider');
  var fpVal   = document.getElementById('ckfFpVal');
  var itemInp = document.getElementById('ckfItemInput');

  if (bktSl) {
    bktSl.addEventListener('input', function () {
      ckfNumBuckets = parseInt(bktSl.value, 10);
      if (bktVal) bktVal.textContent = ckfNumBuckets;
      ckfReset();
    });
  }

  if (sltSl) {
    sltSl.addEventListener('input', function () {
      ckfSlotsPerBkt = parseInt(sltSl.value, 10);
      if (sltVal) sltVal.textContent = ckfSlotsPerBkt;
      ckfReset();
    });
  }

  if (fpSl) {
    fpSl.addEventListener('input', function () {
      ckfFpBits = parseInt(fpSl.value, 10);
      if (fpVal) fpVal.textContent = ckfFpBits + ' bits';
      ckfReset();
    });
  }

  document.getElementById('ckfInsertBtn').addEventListener('click', function () {
    var val = itemInp ? itemInp.value.trim().toLowerCase() : '';
    if (!val) { ckfSetStatus('Enter an item to insert.', 'fail'); return; }
    var r = ckfInsert(val);
    if (r.ok) {
      ckfSetStatus('✅ Inserted "' + val + '" — fp=' + r.detail.fpHex + ', B1=' + r.detail.b1 + ', B2=' + r.detail.b2 + (r.detail.evictChain.length ? ', evictions=' + r.detail.evictChain.length : '') + '.', 'ok');
    } else {
      ckfSetStatus('❌ Filter is full — could not insert "' + val + '". Increase buckets or reduce load.', 'fail');
      ckfAddLog('INSERT FAILED (full): "' + val + '"', 'fail');
    }
    if (itemInp) itemInp.value = '';
  });

  document.getElementById('ckfLookupBtn').addEventListener('click', function () {
    var val = itemInp ? itemInp.value.trim().toLowerCase() : '';
    if (!val) { ckfSetStatus('Enter an item to look up.', 'fail'); return; }
    var r = ckfLookup(val);
    if (r.found) {
      if (r.detail.isFP) {
        ckfSetStatus('🚨 FALSE POSITIVE — "' + val + '" was never inserted, but fp=' + r.detail.fpHex + ' was found in B' + r.detail.foundIn + '.', 'warn');
      } else {
        ckfSetStatus('✅ FOUND "' + val + '" — fp=' + r.detail.fpHex + ' in B' + r.detail.foundIn + '.', 'ok');
        ckfAddLog('LOOKUP "' + val + '" → FOUND in B' + r.detail.foundIn, 'lookup');
      }
    } else {
      ckfSetStatus('❌ NOT FOUND "' + val + '" — fp=' + r.detail.fpHex + ' not in B' + r.detail.b1 + ' or B' + r.detail.b2 + '.', 'fail');
      ckfAddLog('LOOKUP "' + val + '" → NOT FOUND', 'fail');
    }
  });

  document.getElementById('ckfDeleteBtn').addEventListener('click', function () {
    var val = itemInp ? itemInp.value.trim().toLowerCase() : '';
    if (!val) { ckfSetStatus('Enter an item to delete.', 'fail'); return; }
    var r = ckfDelete(val);
    if (r.ok) {
      ckfSetStatus('🗑️ Deleted "' + val + '" — fp=' + r.detail.fpHex + ' removed from B' + r.detail.deletedFrom + '. (A Bloom Filter cannot do this!)', 'ok');
    } else {
      ckfSetStatus('❌ "' + val + '" not found in the filter — fp=' + r.detail.fpHex + ' not in B' + r.detail.b1 + ' or B' + r.detail.b2 + '.', 'fail');
      ckfAddLog('DELETE "' + val + '" → NOT FOUND', 'fail');
    }
    if (itemInp) itemInp.value = '';
  });

  document.getElementById('ckfFpDemoBtn').addEventListener('click', ckfFpDemo);
  document.getElementById('ckfCompareBtn').addEventListener('click', ckfShowComparison);
  document.getElementById('ckfBatchBtn').addEventListener('click', ckfBatchInsert);
  document.getElementById('ckfResetBtn').addEventListener('click', ckfReset);

  if (itemInp) {
    itemInp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('ckfInsertBtn').click();
    });
  }

  window.addEventListener('resize', function () { ckfRenderCanvas(); });
}