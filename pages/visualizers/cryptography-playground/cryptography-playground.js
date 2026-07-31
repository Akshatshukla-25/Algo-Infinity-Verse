/*
 * Cryptography Playground - client-side educational implementation
 * - Classical ciphers: Caesar, Vigenère, Rail Fence, Playfair (educational)
 * - Modern/transform ideas: XOR, Substitution+Permutation, Educational Block Round Pipeline
 *
 * Notes:
 * - This is an educational visualizer (not a production cryptography library).
 */

(() => {
  const $ = (id) => document.getElementById(id);

  function escapeHtml(unsafe) {
    try {
      if (window && window.DOMSanitizer && window.DOMSanitizer.escapeHtml) {
        return window.DOMSanitizer.escapeHtml(unsafe);
      }
    } catch (error) {
      // Fall back to the built-in escaping logic if sanitization fails.
    }

    return String(unsafe == null ? '' : unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#39;');
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function normalizeAlphaOnly(s) {
    return String(s || '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
  }

  function caesarShiftChar(ch, shift) {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      const A = 65;
      return String.fromCharCode(((((code - A + shift) % 26) + 26) % 26) + A);
    }
    return ch;
  }

  function caesarEncrypt(plaintext, key) {
    const shift = (((Number(key) || 0) % 26) + 26) % 26;
    const input = String(plaintext || '');
    let out = '';
    const steps = [];
    for (let i = 0; i < input.length; i++) {
      const before = input[i];
      const after = caesarShiftChar(before, shift);
      out += after;
      steps.push({
        i,
        before,
        after,
        detail: `Shift ${before === after ? '(non-letter)' : ''} by ${shift}.`,
      });
    }
    return { ciphertext: out, steps, meta: { shift } };
  }

  function caesarDecrypt(plaintext, key) {
    const shift = (((Number(key) || 0) % 26) + 26) % 26;
    return caesarEncrypt(String(plaintext || ''), (26 - shift) % 26);
  }

  function vigenereEncrypt(plaintext, key) {
    const k = normalizeAlphaOnly(key);
    const input = String(plaintext || '');
    let ki = 0;
    let out = '';
    const steps = [];

    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      const upper = ch.toUpperCase();

      if (upper >= 'A' && upper <= 'Z') {
        const shift = k.length ? k.charCodeAt(ki % k.length) - 65 : 0;
        const after = caesarShiftChar(upper, shift);
        // preserve original casing when letter
        out += ch === upper ? after : after.toLowerCase();
        steps.push({
          i,
          keyChar: k.length ? k[ki % k.length] : '∅',
          shift,
          before: ch,
          after,
          detail: `Vigenère: ${ch} + shift(${shift}) using key '${k.length ? k[ki % k.length] : '∅'}'.`,
        });
        ki++;
      } else {
        out += ch;
        steps.push({
          i,
          keyChar: '∅',
          shift: 0,
          before: ch,
          after: ch,
          detail: `Non-letter character preserved.`,
        });
      }
    }

    return { ciphertext: out, steps, meta: { key: k } };
  }

  function vigenereDecrypt(ciphertext, key) {
    const k = normalizeAlphaOnly(key);
    const input = String(ciphertext || '');
    let ki = 0;
    let out = '';
    const steps = [];

    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      const upper = ch.toUpperCase();

      if (upper >= 'A' && upper <= 'Z') {
        const shift = k.length ? k.charCodeAt(ki % k.length) - 65 : 0;
        const afterUpper = caesarShiftChar(upper, (26 - shift) % 26);
        out += ch === upper ? afterUpper : afterUpper.toLowerCase();

        steps.push({
          i,
          keyChar: k.length ? k[ki % k.length] : '∅',
          shift,
          before: ch,
          after: ch === upper ? afterUpper : afterUpper.toLowerCase(),
          detail: `Vigenère decrypt: reverse shift(${shift}) using key '${k.length ? k[ki % k.length] : '∅'}'.`,
        });
        ki++;
      } else {
        out += ch;
        steps.push({
          i,
          keyChar: '∅',
          shift: 0,
          before: ch,
          after: ch,
          detail: `Non-letter character preserved.`,
        });
      }
    }

    return { plaintext: out, steps, meta: { key: k } };
  }

  function railFenceIndices(len, rails) {
    // pattern of row indices for each character in zig-zag
    const r = clamp(Math.floor(rails || 2), 2, 20);
    const pattern = [];
    let row = 0;
    let dir = 1; // 1 down, -1 up
    for (let i = 0; i < len; i++) {
      pattern.push(row);
      if (r === 1) continue;
      if (row === 0) dir = 1;
      else if (row === r - 1) dir = -1;
      row += dir;
    }
    return { r, pattern };
  }

  function railFenceEncrypt(plaintext, rails) {
    const input = String(plaintext || '');
    const { r, pattern } = railFenceIndices(input.length, rails);

    const rows = Array.from({ length: r }, () => []);
    const steps = [];

    for (let i = 0; i < input.length; i++) {
      const row = pattern[i];
      rows[row].push(input[i]);
      steps.push({
        i,
        row,
        before: input[i],
        after: input[i],
        detail: `Place char '${input[i]}' into row ${row}.`,
      });
    }

    const out = rows.map((arr) => arr.join('')).join('');

    return { ciphertext: out, steps, meta: { rails: r, rows } };
  }

  function railFenceDecrypt(ciphertext, rails) {
    const input = String(ciphertext || '');
    const { r, pattern } = railFenceIndices(input.length, rails);

    // count how many chars go to each row
    const counts = Array.from({ length: r }, () => 0);
    for (let i = 0; i < pattern.length; i++) counts[pattern[i]]++;

    // slice ciphertext into row buckets
    const rows = [];
    let cursor = 0;
    for (let row = 0; row < r; row++) {
      rows[row] = input.slice(cursor, cursor + counts[row]).split('');
      cursor += counts[row];
    }

    const posInRow = Array.from({ length: r }, () => 0);
    let out = '';
    const steps = [];

    for (let i = 0; i < input.length; i++) {
      const row = pattern[i];
      const before = rows[row][posInRow[row]];
      posInRow[row]++;
      out += before;
      steps.push({
        i,
        row,
        before: before,
        after: before,
        detail: `Take next char from row ${row}.`,
      });
    }

    return { plaintext: out, steps, meta: { rails: r, rows } };
  }

  function playfairBuildSquare(key, variant) {
    // Build 5x5 square. Standard: I/J merged.
    // Educational: may support I/J separated.
    const cleaned = normalizeAlphaOnly(key);

    let alphabet;
    if (variant === 'ij-separated') {
      // 26 letters cannot fit 5x5; we will still build square from A-Z but drop one letter for education.
      alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    } else {
      alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'.split(''); // J removed, I kept
    }

    const seen = new Set();
    const order = [];

    for (const ch0 of cleaned) {
      const ch = variant === 'ij-separated' ? ch0 : ch0 === 'J' ? 'I' : ch0;
      if (!seen.has(ch) && alphabet.includes(ch)) {
        seen.add(ch);
        order.push(ch);
      }
    }

    for (const ch0 of alphabet) {
      if (!seen.has(ch0)) {
        seen.add(ch0);
        order.push(ch0);
      }
    }

    const square = Array.from({ length: 5 }, (_, i) => order.slice(i * 5, i * 5 + 5));
    const pos = new Map();
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) pos.set(square[r][c], { r, c });
    }

    return { square, pos };
  }

  function playfairPreprocess(text) {
    // Keep letters only, uppercase. Non letters removed for classic Playfair education.
    return normalizeAlphaOnly(text);
  }

  function playfairPairs(text, variant) {
    const cleaned = playfairPreprocess(text);
    const mapped = variant === 'ij-separated' ? cleaned : cleaned.replace(/J/g, 'I');

    const pairs = [];
    for (let i = 0; i < mapped.length;) {
      const a = mapped[i];
      const b = mapped[i + 1];
      if (!b) {
        pairs.push([a, 'X']);
        i++;
      } else if (a === b) {
        pairs.push([a, 'X']);
        i++;
      } else {
        pairs.push([a, b]);
        i += 2;
      }
    }
    return pairs;
  }

  function playfairEncrypt(text, key, variant) {
    const { square, pos } = playfairBuildSquare(key, variant);
    const pairs = playfairPairs(text, variant);
    const steps = [];

    const outPairs = pairs.map(([a, b], idx) => {
      const pa = pos.get(a);
      const pb = pos.get(b);
      let ca = a;
      let cb = b;

      if (pa.r === pb.r) {
        ca = square[pa.r][(pa.c + 1) % 5];
        cb = square[pb.r][(pb.c + 1) % 5];
        steps.push({
          pairIndex: idx,
          before: `${a}${b}`,
          after: `${ca}${cb}`,
          detail: `Same row: shift right. (${a}->${ca}, ${b}->${cb})`,
        });
      } else if (pa.c === pb.c) {
        ca = square[(pa.r + 1) % 5][pa.c];
        cb = square[(pb.r + 1) % 5][pb.c];
        steps.push({
          pairIndex: idx,
          before: `${a}${b}`,
          after: `${ca}${cb}`,
          detail: `Same column: shift down. (${a}->${ca}, ${b}->${cb})`,
        });
      } else {
        ca = square[pa.r][pb.c];
        cb = square[pb.r][pa.c];
        steps.push({
          pairIndex: idx,
          before: `${a}${b}`,
          after: `${ca}${cb}`,
          detail: `Rectangle: swap columns. (${a}->${ca}, ${b}->${cb})`,
        });
      }

      return [ca, cb];
    });

    return { ciphertext: outPairs.map((p) => p[0] + p[1]).join(''), steps, meta: { square } };
  }

  function playfairDecrypt(text, key, variant) {
    const { square, pos } = playfairBuildSquare(key, variant);
    const pairs = playfairPairs(text, variant);
    const steps = [];

    const outPairs = pairs.map(([a, b], idx) => {
      const pa = pos.get(a);
      const pb = pos.get(b);
      let ca = a;
      let cb = b;

      if (pa.r === pb.r) {
        ca = square[pa.r][(pa.c + 4) % 5];
        cb = square[pb.r][(pb.c + 4) % 5];
        steps.push({
          pairIndex: idx,
          before: `${a}${b}`,
          after: `${ca}${cb}`,
          detail: `Same row: shift left. (${a}->${ca}, ${b}->${cb})`,
        });
      } else if (pa.c === pb.c) {
        ca = square[(pa.r + 4) % 5][pa.c];
        cb = square[(pb.r + 4) % 5][pb.c];
        steps.push({
          pairIndex: idx,
          before: `${a}${b}`,
          after: `${ca}${cb}`,
          detail: `Same column: shift up. (${a}->${ca}, ${b}->${cb})`,
        });
      } else {
        ca = square[pa.r][pb.c];
        cb = square[pb.r][pa.c];
        steps.push({
          pairIndex: idx,
          before: `${a}${b}`,
          after: `${ca}${cb}`,
          detail: `Rectangle: swap columns (same as encryption for inverse).`,
        });
      }

      return [ca, cb];
    });

    return { plaintext: outPairs.map((p) => p[0] + p[1]).join(''), steps, meta: { square } };
  }

  // XOR (educational): treat plaintext as bytes (UTF-16 code units -> 0..255)
  function toByteArray(s) {
    const input = String(s || '');
    const arr = [];
    for (let i = 0; i < input.length; i++) {
      arr.push(input.charCodeAt(i) & 0xff);
    }
    return arr;
  }

  function fromByteArray(arr) {
    return arr.map((b) => String.fromCharCode(b & 0xff)).join('');
  }

  function parseKeyBytes(key) {
    // If hex 00ff.. length even and <= 64 bytes, parse. Else treat as string bytes.
    const raw = String(key || '').trim();
    const hex = raw.replace(/\s+/g, '');
    const isHex = /^[0-9a-fA-F]+$/.test(hex) && hex.length % 2 === 0;
    if (isHex && hex.length <= 128) {
      const arr = [];
      for (let i = 0; i < hex.length; i += 2) {
        arr.push(parseInt(hex.slice(i, i + 2), 16));
      }
      return arr.length ? arr : [0];
    }
    return toByteArray(raw);
  }

  function xorTransform(input, key) {
    const inBytes = toByteArray(input);
    const keyBytes = parseKeyBytes(key);
    const outBytes = [];
    const steps = [];

    for (let i = 0; i < inBytes.length; i++) {
      const k = keyBytes[i % keyBytes.length];
      const before = inBytes[i];
      const after = before ^ k;
      outBytes.push(after);
      steps.push({
        i,
        before,
        key: k,
        after,
        detail: `XOR: 0x${before.toString(16).padStart(2, '0')} ⊕ 0x${k.toString(16).padStart(2, '0')} = 0x${after.toString(16).padStart(2, '0')}`,
      });
    }

    return {
      ciphertextBytes: outBytes,
      ciphertext: fromByteArray(outBytes),
      steps,
      meta: { keyBytes },
    };
  }

  // Substitution + permutation on bytes (educational)
  function buildSimpleSBox() {
    // fixed SBox (not AES real SBox) but bijective mapping for education.
    const s = Array.from({ length: 256 }, (_, i) => i);
    // deterministic shuffle
    for (let i = 0; i < 256; i++) {
      const j = (i * 73 + 41) % 256;
      const tmp = s[i];
      s[i] = s[j];
      s[j] = tmp;
    }
    return s;
  }

  function invertMapping(map) {
    const inv = new Array(map.length);
    for (let i = 0; i < map.length; i++) inv[map[i]] = i;
    return inv;
  }

  function subpermTransform(input, key, mode) {
    // key determines permutation seed (educational)
    const inBytes = toByteArray(input);
    const sbox = buildSimpleSBox();
    const invS = invertMapping(sbox);

    let seed = 0;
    const kStr = String(key || '');
    for (let i = 0; i < kStr.length; i++) seed = (seed * 131 + kStr.charCodeAt(i)) >>> 0;

    // permutation over byte positions (for current input length)
    const n = inBytes.length;
    const perm = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const j = seed % (i + 1);
      const tmp = perm[i];
      perm[i] = perm[j];
      perm[j] = tmp;
    }
    // perm maps position -> new position index

    const steps = [];

    if (mode === 'encrypt') {
      // Substitution
      const sub = inBytes.map((b, idx) => {
        const after = sbox[b];
        steps.push({
          i: idx,
          before: b,
          after,
          detail: `Substitution: SBox[0x${b.toString(16).padStart(2, '0')}] = 0x${after
            .toString(16)
            .padStart(2, '0')}`,
        });
        return after;
      });

      // Permutation
      const out = new Array(n);
      for (let i = 0; i < n; i++) {
        const dest = perm[i];
        out[dest] = sub[i];
      }
      steps.push({
        i: -1,
        before: null,
        after: null,
        detail: `Permutation: bytes are rearranged using a deterministic permutation derived from the key.`,
        perm,
      });

      return { ciphertext: fromByteArray(out), ciphertextBytes: out, steps, meta: { perm } };
    }

    // decrypt (inverse substitution + inverse permutation)
    const ciphertextBytes = inBytes;

    // inverse permutation
    const invPerm = new Array(n);
    for (let i = 0; i < n; i++) invPerm[perm[i]] = i;

    const unperm = new Array(n);
    for (let i = 0; i < n; i++) {
      const src = invPerm[i];
      unperm[i] = ciphertextBytes[src];
    }

    const out = unperm.map((b, idx) => {
      const after = invS[b];
      steps.push({
        i: idx,
        before: b,
        after,
        detail: `InvSubstitution: SBox^{-1}[0x${b.toString(16).padStart(2, '0')}] = 0x${after
          .toString(16)
          .padStart(2, '0')}`,
      });
      return after;
    });

    steps.push({
      i: -1,
      before: null,
      after: null,
      detail: `Inverse permutation applied, then inverse substitution.`,
      perm,
    });

    return { plaintext: fromByteArray(out), plaintextBytes: out, steps, meta: { perm } };
  }

  function blockRoundPipeline(input, key, mode, rounds = 3) {
    // Educational: 16-byte (padded) block pipeline: XOR -> Sub(byte) -> Permute(pos)
    const inBytes = toByteArray(input);
    const blockSize = 16;

    const padded = inBytes.slice();
    while (padded.length % blockSize !== 0) padded.push(0);

    const keyBytes = parseKeyBytes(key);

    const sbox = buildSimpleSBox();
    const invS = invertMapping(sbox);

    const steps = [];

    function makePerm(n, seed) {
      const perm = Array.from({ length: n }, (_, i) => i);
      for (let i = n - 1; i > 0; i--) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const j = seed % (i + 1);
        const tmp = perm[i];
        perm[i] = perm[j];
        perm[j] = tmp;
      }
      return perm;
    }

    function seedFromKeyAndRound(roundIdx) {
      let seed = 0;
      const kStr = String(key || '');
      for (let i = 0; i < kStr.length; i++)
        seed = (seed * 131 + kStr.charCodeAt(i) + roundIdx * 17) >>> 0;
      return seed;
    }

    const out = padded.slice();

    const blocks = padded.length / blockSize;

    if (mode === 'encrypt') {
      for (let b = 0; b < blocks; b++) {
        const start = b * blockSize;
        let state = out.slice(start, start + blockSize);

        steps.push({
          type: 'block-start',
          b,
          detail: `Start block ${b} (16 bytes).`,
          state: state.slice(),
        });

        for (let r = 0; r < rounds; r++) {
          // XOR round key (educational)
          const rk = new Array(blockSize);
          for (let i = 0; i < blockSize; i++)
            rk[i] = keyBytes[(start + i) % keyBytes.length] ^ ((r + 1) * 17);
          const afterXor = state.map((v, i) => {
            const x = v ^ rk[i];
            return x;
          });
          steps.push({
            type: 'xor',
            b,
            r,
            before: state.slice(),
            roundKey: rk.slice(),
            after: afterXor.slice(),
            detail: `Round ${r + 1}: XOR with round key.`,
          });

          // SubBytes (educational SBox)
          const afterSub = afterXor.map((v) => sbox[v]);
          steps.push({
            type: 'sub',
            b,
            r,
            before: afterXor.slice(),
            after: afterSub.slice(),
            detail: `Round ${r + 1}: Substitution via educational SBox.`,
          });

          // Permutation (educational)
          const perm = makePerm(blockSize, seedFromKeyAndRound(r));
          const afterPerm = new Array(blockSize);
          for (let i = 0; i < blockSize; i++) afterPerm[perm[i]] = afterSub[i];

          steps.push({
            type: 'perm',
            b,
            r,
            perm,
            before: afterSub.slice(),
            after: afterPerm.slice(),
            detail: `Round ${r + 1}: Permute byte positions.`,
          });

          state = afterPerm;
        }

        for (let i = 0; i < blockSize; i++) out[start + i] = state[i];
        steps.push({ type: 'block-end', b, detail: `End block ${b}.`, state: state.slice() });
      }

      return { ciphertextBytes: out, ciphertext: fromByteArray(out), steps, meta: { rounds } };
    }

    // decrypt
    for (let b = 0; b < blocks; b++) {
      const start = b * blockSize;
      let state = out.slice(start, start + blockSize);

      steps.push({
        type: 'block-start-dec',
        b,
        detail: `Start decrypt block ${b}.`,
        state: state.slice(),
      });

      for (let r = rounds - 1; r >= 0; r--) {
        const perm = makePerm(blockSize, seedFromKeyAndRound(r));
        const invPerm = new Array(blockSize);
        for (let i = 0; i < blockSize; i++) invPerm[perm[i]] = i;

        const unperm = new Array(blockSize);
        for (let i = 0; i < blockSize; i++) unperm[i] = state[invPerm[i]];

        const unSub = unperm.map((v) => invS[v]);

        const rk = new Array(blockSize);
        for (let i = 0; i < blockSize; i++)
          rk[i] = keyBytes[(start + i) % keyBytes.length] ^ ((r + 1) * 17);

        const afterXor = unSub.map((v, i) => v ^ rk[i]);

        steps.push({
          type: 'inv-round',
          b,
          r,
          before: state.slice(),
          after: afterXor.slice(),
          detail: `Inverse Round ${r + 1}: InvPerm -> InvSub -> XOR.`,
        });

        state = afterXor;
      }

      for (let i = 0; i < blockSize; i++) out[start + i] = state[i];
      steps.push({
        type: 'block-end-dec',
        b,
        detail: `End decrypt block ${b}.`,
        state: state.slice(),
      });
    }

    // trim padding zeros at the end (best-effort for education)
    const trimmed = out.slice();
    while (trimmed.length > 0 && trimmed[trimmed.length - 1] === 0) trimmed.pop();

    return { plaintextBytes: trimmed, plaintext: fromByteArray(trimmed), steps, meta: { rounds } };
  }

  function formatByteHex(b) {
    return '0x' + (b & 0xff).toString(16).padStart(2, '0').toUpperCase();
  }

  function renderStep(step, algo) {
    const visual = $('stepVisual');
    const expl = $('stepExplanation');

    if (!visual || !expl) return;

    const progressMeta = $('stepProgressMeta');

    let content = '';

    if (algo === 'caesar') {
      content = `
        <div class="step-title">${escapeHtml(step.detail)}</div>
        <div class="matrix-row">
          <span class="byte-pill highlight">Index ${step.i}</span>
          <span class="byte-pill">${escapeHtml(step.before)} → ${escapeHtml(step.after)}</span>
        </div>
      `;
      expl.innerHTML = `
        <p>${escapeHtml(step.detail)}</p>
        <p class="muted">Caesar shifts letters by a constant amount (preserves non-letters).</p>
      `;
    } else if (algo === 'vigenere') {
      content = `
        <div class="step-title">${escapeHtml(step.detail)}</div>
        <div class="matrix-row">
          <span class="byte-pill highlight">Index ${step.i}</span>
          <span class="byte-pill">Key '${escapeHtml(step.keyChar)}' (shift ${step.shift})</span>
          <span class="byte-pill">${escapeHtml(step.before)} → ${escapeHtml(step.after)}</span>
        </div>
      `;
      expl.innerHTML = `
        <p>${escapeHtml(step.detail)}</p>
        <p class="muted">Vigenère uses a repeating key to apply varying shifts.</p>
      `;
    } else if (algo === 'railfence') {
      content = `
        <div class="step-title">${escapeHtml(step.detail)}</div>
        <div class="matrix-row">
          <span class="byte-pill highlight">Index ${step.i}</span>
          <span class="byte-pill">Row ${step.row}</span>
          <span class="byte-pill">Char: ${escapeHtml(step.before)}</span>
        </div>
      `;
      expl.innerHTML = `
        <p>${escapeHtml(step.detail)}</p>
        <p class="muted">Rail Fence writes the message in a zig-zag across rails.</p>
      `;
    } else if (algo === 'playfair') {
      content = `
        <div class="step-title">${escapeHtml(step.detail)}</div>
        <div class="matrix-row">
          <span class="byte-pill highlight">Pair ${step.pairIndex + 1}</span>
          <span class="byte-pill">${escapeHtml(step.before)} → ${escapeHtml(step.after)}</span>
        </div>
      `;
      expl.innerHTML = `
        <p>${escapeHtml(step.detail)}</p>
        <p class="muted">Playfair encrypts digraphs using a 5×5 key square.</p>
      `;
    } else if (algo === 'xor') {
      content = `
        <div class="step-title">${escapeHtml(step.detail)}</div>
        <div class="matrix-row">
          <span class="byte-pill highlight">Index ${step.i}</span>
          <span class="byte-pill">${formatByteHex(step.before)} ⊕ ${formatByteHex(step.key)} = ${formatByteHex(step.after)}</span>
        </div>
      `;
      expl.innerHTML = `
        <p>${escapeHtml(step.detail)}</p>
        <p class="muted">XOR is its own inverse: encrypting again with the same key decrypts.</p>
      `;
    } else if (algo === 'subperm') {
      if (step.i === -1) {
        content = `
          <div class="step-title">${escapeHtml(step.detail)}</div>
          <div class="matrix-row">
            <span class="byte-pill">Permutation length: ${step.perm ? step.perm.length : '—'}</span>
          </div>
        `;
        expl.innerHTML = `
          <p>${escapeHtml(step.detail)}</p>
          <p class="muted">We apply a bijective byte substitution then rearrange byte positions.</p>
        `;
      } else {
        content = `
          <div class="step-title">${escapeHtml(step.detail)}</div>
          <div class="matrix-row">
            <span class="byte-pill highlight">Index ${step.i}</span>
            <span class="byte-pill">${formatByteHex(step.before)} → ${formatByteHex(step.after)}</span>
          </div>
        `;
        expl.innerHTML = `
          <p>${escapeHtml(step.detail)}</p>
          <p class="muted">Substitution changes byte values; decryption uses the inverse SBox.</p>
        `;
      }
    } else if (algo === 'blockrounds') {
      // pipeline steps are richer
      content = '';
      if (step.type === 'block-start' || step.type === 'block-start-dec') {
        content = `
          <div class="step-title">${escapeHtml(step.detail)}</div>
          <div class="matrix-row">${(step.state || [])
            .slice(0, 16)
            .map((b) => `<span class="byte-pill">${formatByteHex(b)}</span>`)
            .join('')}</div>
        `;
        expl.innerHTML = `<p>${escapeHtml(step.detail)}</p><p class="muted">We process 16-byte blocks with a round-like pipeline (XOR → Sub → Permute).</p>`;
      } else if (step.type === 'xor') {
        content = `
          <div class="step-title">${escapeHtml(step.detail)}</div>
          <div class="matrix-row">
            <span class="byte-pill highlight">Block ${step.b} · Round ${step.r + 1}</span>
          </div>
          <div class="matrix-row" style="margin-top: 0.6rem;">
            ${(step.before || []).map((v, i) => `<span class="byte-pill">${formatByteHex(v)} ⊕ ${formatByteHex(step.roundKey[i])} = ${formatByteHex(step.after[i])}</span>`).join('')}
          </div>
        `;
        expl.innerHTML = `<p>${escapeHtml(step.detail)}</p><p class="muted">Each round XORs state bytes with a derived round key (educational).</p>`;
      } else if (step.type === 'sub') {
        content = `
          <div class="step-title">${escapeHtml(step.detail)}</div>
          <div class="matrix-row">
            <span class="byte-pill highlight">Block ${step.b} · Round ${step.r + 1}</span>
          </div>
          <div class="matrix-row" style="margin-top: 0.6rem;">
            ${(step.before || []).map((v, i) => `<span class="byte-pill">${formatByteHex(v)} → ${formatByteHex(step.after[i])}</span>`).join('')}
          </div>
        `;
        expl.innerHTML = `<p>${escapeHtml(step.detail)}</p><p class="muted">Substitution uses an educational bijective SBox (not real AES SBox).</p>`;
      } else if (step.type === 'perm') {
        content = `
          <div class="step-title">${escapeHtml(step.detail)}</div>
          <div class="matrix-row">
            <span class="byte-pill highlight">Block ${step.b} · Round ${step.r + 1}</span>
            <span class="byte-pill">Perm: ${step.perm ? step.perm.join(', ') : '—'}</span>
          </div>
        `;
        expl.innerHTML = `<p>${escapeHtml(step.detail)}</p><p class="muted">Permutation reorders byte positions to increase diffusion.</p>`;
      } else if (step.type === 'inv-round') {
        content = `
          <div class="step-title">${escapeHtml(step.detail)}</div>
          <div class="matrix-row">
            <span class="byte-pill highlight">Block ${step.b} · Inverse Round ${step.r + 1}</span>
          </div>
        `;
        expl.innerHTML = `<p>${escapeHtml(step.detail)}</p><p class="muted">Decryption applies the inverse permutation and inverse substitution, then XORs again.</p>`;
      } else {
        content = `<div class="step-title">${escapeHtml(step.detail || 'Step')}</div>`;
        expl.innerHTML = `<p>${escapeHtml(step.detail || '')}</p>`;
      }
    } else {
      content = `<div class="step-title">${escapeHtml(step.detail || 'Step')}</div>`;
      expl.innerHTML = `<p>${escapeHtml(step.detail || '')}</p>`;
    }

    visual.innerHTML = content;

    if (progressMeta && window.__cryptState) {
      const s = window.__cryptState;
      progressMeta.textContent = `Step ${s.idx + 1} / ${s.steps.length || 0}`;
    }
  }

  function algoLabel(algo) {
    const map = {
      caesar: 'Caesar Cipher',
      vigenere: 'Vigenère Cipher',
      railfence: 'Rail Fence Cipher',
      playfair: 'Playfair Cipher',
      xor: 'XOR Transform',
      subperm: 'Substitution + Permutation',
      blockrounds: 'Block Round Pipeline',
    };
    return map[algo] || algo;
  }

  function algorithmEncryptDecrypt(algo, mode, plaintext, key, rails, playfairVariant) {
    if (algo === 'caesar') {
      return mode === 'encrypt' ? caesarEncrypt(plaintext, key) : caesarDecrypt(plaintext, key);
    }

    if (algo === 'vigenere') {
      if (mode === 'encrypt') return vigenereEncrypt(plaintext, key);
      return vigenereDecrypt(plaintext, key);
    }

    if (algo === 'railfence') {
      return mode === 'encrypt'
        ? railFenceEncrypt(plaintext, rails)
        : railFenceDecrypt(plaintext, rails);
    }

    if (algo === 'playfair') {
      return mode === 'encrypt'
        ? playfairEncrypt(plaintext, key, playfairVariant)
        : playfairDecrypt(plaintext, key, playfairVariant);
    }

    if (algo === 'xor') {
      const res = xorTransform(plaintext, key);
      // XOR decrypt == encrypt
      return mode === 'encrypt'
        ? res
        : { plaintext: res.ciphertext, steps: res.steps, meta: res.meta };
    }

    if (algo === 'subperm') {
      return subpermTransform(plaintext, key, mode);
    }

    if (algo === 'blockrounds') {
      return blockRoundPipeline(plaintext, key, mode, 3);
    }

    return { ciphertext: '', steps: [], meta: {} };
  }

  function setStepUIEnabled(stepsLen, idx) {
    const back = $('btnStepBack');
    const forward = $('btnStepForward');

    if (!back || !forward) return;

    if (!stepsLen || stepsLen <= 0) {
      back.disabled = true;
      forward.disabled = true;
      return;
    }

    back.disabled = idx <= 0;
    forward.disabled = idx >= stepsLen - 1;
  }

  function renderProgress(stepsLen, idx) {
    const fill = $('stepProgressFill');
    const meta = $('stepProgressMeta');

    if (!fill) return;

    const pct = stepsLen > 1 ? (idx / (stepsLen - 1)) * 100 : stepsLen ? 100 : 0;
    fill.style.width = pct.toFixed(1) + '%';
    if (meta) meta.textContent = `Step ${idx + 1} / ${stepsLen}`;
  }

  function buildExerciseList() {
    const list = $('exerciseList');
    if (!list) return;

    const exercises = [
      {
        id: 'ex-caesar',
        title: 'Exercise 1: Caesar',
        prompt: 'Encrypt HELLO with shift 3.',
        algo: 'caesar',
        mode: 'encrypt',
        plaintext: 'HELLO',
        key: 3,
        rails: 3,
        playfairVariant: 'standard',
        expected: 'KHOOR',
      },
      {
        id: 'ex-vigenere',
        title: 'Exercise 2: Vigenère',
        prompt: 'Encrypt ATTACK with key LEMON (letters only).',
        algo: 'vigenere',
        mode: 'encrypt',
        plaintext: 'ATTACK',
        key: 'LEMON',
        rails: 3,
        playfairVariant: 'standard',
        expected: (() => {
          // educational expected: using classic Vigenère (A=0 shifts). We'll compute at runtime to be safe.
          const res = vigenereEncrypt('ATTACK', 'LEMON');
          return res.ciphertext.toUpperCase();
        })(),
      },
      {
        id: 'ex-xor',
        title: 'Exercise 3: XOR',
        prompt: 'XOR "A" with key byte 0x01. What is the resulting byte (hex)?',
        algo: 'xor',
        mode: 'encrypt',
        plaintext: 'A',
        key: '01', // hex
        rails: 3,
        playfairVariant: 'standard',
        expected: (() => {
          const res = xorTransform('A', '01');
          // output one byte
          const b = res.ciphertextBytes[0];
          return formatByteHex(b);
        })(),
      },
    ];

    list.innerHTML = exercises
      .map((ex) => {
        return `
          <div class="exercise-item" data-ex-id="${escapeHtml(ex.id)}">
            <h4>${escapeHtml(ex.title)}</h4>
            <p>${escapeHtml(ex.prompt)}</p>
            <input type="text" class="exercise-input" placeholder="Your answer" />
            <div class="exercise-actions">
              <button type="button" class="btn btn-secondary exercise-check" data-algo="${escapeHtml(
                ex.algo
              )}"><i class="fas fa-check"></i> Check</button>
              <div class="exercise-feedback" aria-live="polite"></div>
            </div>
          </div>
        `;
      })
      .join('');

    list.addEventListener('click', (e) => {
      const btn = e.target.closest('.exercise-check');
      if (!btn) return;
      const card = e.target.closest('.exercise-item');
      if (!card) return;

      const id = card.getAttribute('data-ex-id');
      const ex = exercises.find((x) => x.id === id);
      if (!ex) return;

      const input = card.querySelector('.exercise-input');
      const feedback = card.querySelector('.exercise-feedback');
      if (!input || !feedback) return;

      const user = String(input.value || '').trim();
      const ok = user.toUpperCase() === String(ex.expected || '').toUpperCase();

      feedback.textContent = ok
        ? `Correct ✅ Expected: ${ex.expected}`
        : `Incorrect ❌ Expected: ${ex.expected}`;
      feedback.className = 'exercise-feedback ' + (ok ? 'ok' : 'bad');

      // Also run the correct algorithm and update the visualizer steps
      try {
        const result = algorithmEncryptDecrypt(
          ex.algo,
          ex.mode,
          ex.plaintext,
          ex.key,
          ex.rails,
          ex.playfairVariant
        );

        // Push to main engine
        setEngineFromExercise(ex);
        // and update step visual
        setResultAndSteps(ex.algo, result);
      } catch (err) {
        // ignore
      }
    });

    function setEngineFromExercise(ex) {
      $('cipherSelect').value = ex.algo;
      $('modeSelect').value = ex.mode;
      $('plaintextInput').value = ex.plaintext;
      $('keyInput').value = ex.key;
      $('railsInput').value = ex.rails;
      $('playfairModeSelect').value = ex.playfairVariant;
    }
  }

  function setResultAndSteps(algo, result) {
    // steps are always in result.steps
    const steps = result.steps || [];
    window.__cryptState.steps = steps;
    window.__cryptState.idx = 0;
    window.__cryptState.algo = algo;

    $('enginePill').textContent = `${algoLabel(algo)}: ${$('modeSelect').value}`;

    // outputs
    if ($('modeSelect').value === 'encrypt') {
      $('ciphertextOutput').textContent = result.ciphertext != null ? result.ciphertext : '—';
    } else {
      // decrypt mode: ciphertextOutput becomes decrypted for consistency
      $('ciphertextOutput').textContent = result.plaintext != null ? result.plaintext : '—';
    }

    // verification always tries to decrypt ciphertext back
    updateVerification(algo);

    $('stepPill').textContent = `Step 1`;
    renderProgress(steps.length, 0);
    setStepUIEnabled(steps.length, 0);

    const step = steps[0];
    if (step) renderStep(step, algo);
    else {
      $('stepVisual').innerHTML = '<div class="placeholder">No steps produced.</div>';
      $('stepExplanation').innerHTML = '<div class="placeholder">—</div>';
    }
  }

  function updateVerification(algo) {
    if (algo === 'xor') {
      // ciphertextOutput is raw string; verification will run decrypt.
    }
    const mode = $('modeSelect').value;
    const key = $('keyInput').value;
    const rails = Number($('railsInput').value || 3);
    const playfairVariant = $('playfairModeSelect').value;

    const current = $('ciphertextOutput').textContent;

    // If current is ciphertext (encrypt mode), decrypt it.
    // If current is plaintext (decrypt mode), decrypt would mean encrypting. We'll just do inverse of mode.
    const verifyMode = mode === 'encrypt' ? 'decrypt' : 'encrypt';

    const verify = algorithmEncryptDecrypt(algo, verifyMode, current, key, rails, playfairVariant);
    const decrypted =
      verify.plaintext != null
        ? verify.plaintext
        : verify.ciphertext != null
          ? verify.ciphertext
          : '—';
    $('decryptedOutput').textContent = decrypted;
  }

  function randomizeInputs() {
    const algo = $('cipherSelect').value;
    // Keep plaintext reasonably short for educational visuals.
    const samplePlain = ['HELLO WORLD', 'ATTACK AT DAWN', 'SECRETS', 'CIPHER TEST', 'CRYPTO'];

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    $('plaintextInput').value = pick(samplePlain);

    if (algo === 'caesar') {
      $('keyInput').value = String(Math.floor(Math.random() * 26));
    } else if (algo === 'vigenere') {
      $('keyInput').value = pick(['LEMON', 'KEY', 'SECRET', 'ORANGE', 'CIPHER']);
    } else if (algo === 'railfence') {
      $('railsInput').value = String(2 + Math.floor(Math.random() * 6));
      $('keyInput').value = '—';
    } else if (algo === 'playfair') {
      $('keyInput').value = pick(['PLAYFAIR', 'MONARCHY', 'KEYWORD', 'SECRET']);
    } else if (algo === 'xor') {
      $('keyInput').value = pick(['0f', '01', 'aa', '2b', '10ff']);
    } else if (algo === 'subperm') {
      $('keyInput').value = pick(['alpha', 'beta', 'gamma', 'delta', 'key123']);
    } else if (algo === 'blockrounds') {
      $('keyInput').value = pick(['blockKey', 'roundKey', 'AES', 'infinity', 'crypt']);
    }

    // Run immediately
    runEngine();
  }

  function reset() {
    // reset to defaults
    $('cipherSelect').value = 'caesar';
    $('modeSelect').value = 'encrypt';
    $('plaintextInput').value = 'Hello AES Visual';
    $('keyInput').value = '3';
    $('railsInput').value = '3';
    $('playfairModeSelect').value = 'standard';

    $('ciphertextOutput').textContent = '—';
    $('decryptedOutput').textContent = '—';
    $('stepVisual').innerHTML =
      '<div class="placeholder">Run an algorithm to see transformation steps.</div>';
    $('stepExplanation').innerHTML =
      '<div class="placeholder">Explanations will appear here.</div>';

    window.__cryptState.steps = [];
    window.__cryptState.idx = 0;
    window.__cryptState.algo = $('cipherSelect').value;
    renderProgress(0, 0);
    setStepUIEnabled(0, 0);
    $('stepPill').textContent = 'Step 0';
    $('enginePill').textContent = 'Ready';
    stopAutoplay();
  }

  function runEngine() {
    const algo = $('cipherSelect').value;
    const mode = $('modeSelect').value;
    const plaintext = $('plaintextInput').value || '';
    const key = $('keyInput').value || '';
    const rails = Number($('railsInput').value || 3);
    const playfairVariant = $('playfairModeSelect').value;

    let result;
    try {
      result = algorithmEncryptDecrypt(algo, mode, plaintext, key, rails, playfairVariant);
    } catch (e) {
      $('enginePill').textContent = 'Error';
      console.error(e);
      $('ciphertextOutput').textContent = 'Error';
      $('decryptedOutput').textContent = '—';
      window.__cryptState.steps = [];
      window.__cryptState.idx = 0;
      return;
    }

    setResultAndSteps(algo, result);
    stopAutoplay();
  }

  function stepForward() {
    const s = window.__cryptState;
    if (!s.steps.length) return;
    if (s.idx >= s.steps.length - 1) return;
    s.idx += 1;
    const step = s.steps[s.idx];
    $('stepPill').textContent = `Step ${s.idx + 1}`;
    renderProgress(s.steps.length, s.idx);
    setStepUIEnabled(s.steps.length, s.idx);
    if (step) renderStep(step, s.algo);
  }

  function stepBackward() {
    const s = window.__cryptState;
    if (!s.steps.length) return;
    if (s.idx <= 0) return;
    s.idx -= 1;
    const step = s.steps[s.idx];
    $('stepPill').textContent = `Step ${s.idx + 1}`;
    renderProgress(s.steps.length, s.idx);
    setStepUIEnabled(s.steps.length, s.idx);
    if (step) renderStep(step, s.algo);
  }

  function playAutoplay() {
    const s = window.__cryptState;
    if (!s.steps.length) return;

    stopAutoplay();
    s.playing = true;

    const btn = $('btnAutoPlay');
    if (btn) btn.textContent = 'Pause';

    s.autoplayTimer = setInterval(() => {
      if (s.idx >= s.steps.length - 1) {
        stopAutoplay();
        return;
      }
      stepForward();
    }, 650);
  }

  function stopAutoplay() {
    const s = window.__cryptState;
    if (s.autoplayTimer) {
      clearInterval(s.autoplayTimer);
      s.autoplayTimer = null;
    }
    s.playing = false;
    const btn = $('btnAutoPlay');
    if (btn) btn.innerHTML = '<i class="fas fa-play"></i> Auto Play';
  }

  function init() {
    window.__cryptState = {
      steps: [],
      idx: 0,
      algo: $('cipherSelect').value,
      playing: false,
      autoplayTimer: null,
    };

    // Build exercises
    buildExerciseList();

    // Events
    const btnRandomize = $('btnRandomize');
    const btnReset = $('btnReset');
    const btnRun = $('btnEncryptDecrypt');

    if (btnRandomize) btnRandomize.addEventListener('click', randomizeInputs);
    if (btnReset) btnReset.addEventListener('click', reset);
    if (btnRun) btnRun.addEventListener('click', runEngine);

    const btnStepBack = $('btnStepBack');
    const btnStepForward = $('btnStepForward');
    const btnAutoPlay = $('btnAutoPlay');

    if (btnStepBack) btnStepBack.addEventListener('click', stepBackward);
    if (btnStepForward) btnStepForward.addEventListener('click', stepForward);
    if (btnAutoPlay)
      btnAutoPlay.addEventListener('click', () => {
        if (window.__cryptState.playing) {
          stopAutoplay();
        } else {
          playAutoplay();
        }
      });

    // Compare
    const btnCompare = $('btnCompare');
    if (btnCompare) {
      btnCompare.addEventListener('click', () => {
        const a = $('compareA').value;
        const b = $('compareB').value;
        const mode = 'encrypt';

        const plaintext = $('plaintextInput').value || '';
        const key = $('keyInput').value || '';
        const rails = Number($('railsInput').value || 3);
        const playfairVariant = $('playfairModeSelect').value;

        const resA = algorithmEncryptDecrypt(a, mode, plaintext, key, rails, playfairVariant);
        const resB = algorithmEncryptDecrypt(b, mode, plaintext, key, rails, playfairVariant);

        $('compareAName').textContent = algoLabel(a).split(' ')[0];
        $('compareBName').textContent = algoLabel(b).split(' ')[0];

        $('compareAOut').textContent = resA.ciphertext != null ? resA.ciphertext : resA.plaintext;
        $('compareBOut').textContent = resB.ciphertext != null ? resB.ciphertext : resB.plaintext;
      });
    }

    // Randomize/play safety: reset steps if algo changes
    const cipherSelect = $('cipherSelect');
    if (cipherSelect) {
      cipherSelect.addEventListener('change', () => {
        stopAutoplay();
        window.__cryptState.steps = [];
        window.__cryptState.idx = 0;
        window.__cryptState.algo = cipherSelect.value;
        $('stepVisual').innerHTML =
          '<div class="placeholder">Run an algorithm to see transformation steps.</div>';
        $('stepExplanation').innerHTML =
          '<div class="placeholder">Explanations will appear here.</div>';
        $('ciphertextOutput').textContent = '—';
        $('decryptedOutput').textContent = '—';
        setStepUIEnabled(0, 0);
        renderProgress(0, 0);
        $('stepPill').textContent = 'Step 0';
        $('enginePill').textContent = 'Ready';
      });
    }

    reset();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
