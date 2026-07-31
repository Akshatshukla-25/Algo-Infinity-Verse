/**
 * zkp-visualizer.js
 * Educational Simulation of a Zero-Knowledge Proof constraint system.
 * Converts the circuit f(x, y) = x * y + 2 into Rank-1 Constraint System (R1CS) matrices,
 * generates a witness vector based on a finite prime field, and mathematically verifies it.
 */

document.addEventListener('DOMContentLoaded', () => {
  initZKPVisualizer();
  initZKCanvas();
});

// ==========================================
// 1. ZKP MATHEMATICS & STATE
// ==========================================
const PRIME = 97; // Finite field modulo

// Modular Arithmetic Helpers
const mod = (n, p = PRIME) => ((n % p) + p) % p;
const addMod = (a, b) => mod(a + b);
const mulMod = (a, b) => mod(a * b);

// R1CS Matrices for the equation: out = x * y + 2
// Gates:
// 1. v1 = x * y
// 2. out = v1 + 2 * 1
// Witness vector s = [~one, ~out, x, y, v1]
const A = [
  [0, 0, 1, 0, 0], // x
  [2, 0, 0, 0, 1], // 2*1 + v1
];
const B = [
  [0, 0, 0, 1, 0], // y
  [1, 0, 0, 0, 0], // 1
];
const C = [
  [0, 0, 0, 0, 1], // v1
  [0, 1, 0, 0, 0], // out
];

let state = {
  x: 3,
  y: 4,
  out: 0,
  witness: [], // s
  isProofGenerated: false,
  isFiatShamir: false,
  challenge: null,
};

// DOM Elements
const els = {
  inputX: document.getElementById('inputX'),
  inputY: document.getElementById('inputY'),
  proverCalculation: document.getElementById('proverCalculation'),

  btnGenerateWitness: document.getElementById('btnGenerateWitness'),
  witnessContainer: document.getElementById('witnessContainer'),
  witnessVector: document.getElementById('witnessVector'),
  btnGenerateProof: document.getElementById('btnGenerateProof'),

  matrixA: document.getElementById('matrixA'),
  matrixB: document.getElementById('matrixB'),
  matrixC: document.getElementById('matrixC'),
  networkAnim: document.getElementById('networkAnim'),

  verifierOutput: document.getElementById('verifierOutput'),
  verifierProofStatus: document.getElementById('verifierProofStatus'),
  btnVerify: document.getElementById('btnVerify'),

  verificationResults: document.getElementById('verificationResults'),
  checkGate1: document.getElementById('checkGate1'),
  checkGate2: document.getElementById('checkGate2'),
  finalVerdict: document.getElementById('finalVerdict'),

  // New UI Hooks
  fiatShamirToggle: document.getElementById('fiatShamirToggle'),
  interactiveLabel: document.querySelector('.interactive-label'),
  fsLabel: document.querySelector('.fs-label'),
  challengeBox: document.getElementById('challengeBox'),
  challengeValue: document.getElementById('challengeValue'),
  verifierHeading: document.getElementById('verifierHeading'),
  verifierTitle: document.getElementById('verifierTitle'),
  verifierInstruction: document.getElementById('verifierInstruction'),
  verifierPanel: document.getElementById('verifierPanel'),
  animPacket: document.getElementById('animPacket'),
  packetLabel: document.getElementById('packetLabel'),
};

// ==========================================
// 2. INITIALIZATION & UI BINDING
// ==========================================
function initZKPVisualizer() {
  renderMatrices();
  updateProverCalculation();

  // Bind Inputs
  els.inputX.addEventListener('input', updateProverCalculation);
  els.inputY.addEventListener('input', updateProverCalculation);

  // Bind Buttons
  els.btnGenerateWitness.addEventListener('click', handleGenerateWitness);
  els.btnGenerateProof.addEventListener('click', handleGenerateProof);
  els.btnVerify.addEventListener('click', handleVerification);

  // Bind Toggle
  if (els.fiatShamirToggle) {
    els.fiatShamirToggle.addEventListener('change', handleToggleMode);
  }
}

function handleToggleMode(e) {
  state.isFiatShamir = e.target.checked;

  if (state.isFiatShamir) {
    els.interactiveLabel.classList.remove('active');
    els.fsLabel.classList.add('active');

    // Morph Verifier into Hash Function
    els.verifierTitle.innerHTML = 'Smart Contract / Hash Function';
    els.verifierHeading.innerHTML = '<i class="fas fa-link"></i> ' + els.verifierTitle.outerHTML;
    els.verifierInstruction.innerHTML =
      'The verifier is completely <strong>non-interactive</strong>. It verifies the cryptographic Hash(Commitment) directly and mathematical equations in a single step.';
    els.verifierPanel.classList.add('fiat-shamir-mode');
  } else {
    els.fsLabel.classList.remove('active');
    els.interactiveLabel.classList.add('active');

    // Morph back to Bob
    els.verifierTitle.innerHTML = 'The Verifier (Bob)';
    els.verifierHeading.innerHTML =
      '<i class="fas fa-shield-alt"></i> ' + els.verifierTitle.outerHTML;
    els.verifierInstruction.innerHTML =
      'The Verifier only receives the <strong>Public Output</strong> and the <strong>Proof π</strong>. They never see x or y.';
    els.verifierPanel.classList.remove('fiat-shamir-mode');
  }

  updateProverCalculation();
}

function renderMatrices() {
  renderMatrix(A, els.matrixA);
  renderMatrix(B, els.matrixB);
  renderMatrix(C, els.matrixC);
}

function renderMatrix(matrix, container) {
  container.innerHTML = '';
  matrix.forEach((row) => {
    row.forEach((val) => {
      const cell = document.createElement('div');
      cell.className = `m-cell ${val > 0 ? 'active val-' + val : ''}`;
      cell.textContent = val;
      container.appendChild(cell);
    });
  });
}

// ==========================================
// 3. THE PROVER (Generating Witness & Proof)
// ==========================================
function updateProverCalculation() {
  const x = parseInt(els.inputX.value) || 0;
  const y = parseInt(els.inputY.value) || 0;

  // Reset down-stream UI
  els.witnessContainer.classList.add('hidden');
  els.challengeBox.classList.add('hidden');
  els.networkAnim.classList.add('hidden');
  els.verificationResults.classList.add('hidden');
  els.verifierOutput.textContent = '?';
  els.verifierProofStatus.textContent = 'Waiting...';
  els.verifierProofStatus.className = 'text-secondary';
  els.btnVerify.disabled = true;
  els.btnGenerateProof.disabled = true;
  state.isProofGenerated = false;
  state.challenge = null;

  // Modulo arithmetic
  const v1 = mulMod(x, y);
  const out = addMod(v1, 2);

  els.proverCalculation.innerHTML = `
        v1 = (${x} * ${y}) mod 97 = ${v1}<br>
        out = (v1 + 2) mod 97 = ${out}
    `;

  state.x = x;
  state.y = y;
  state.out = out;
}

function handleGenerateWitness() {
  const v1 = mulMod(state.x, state.y);
  // Construct Witness Vector s = [1, out, x, y, v1]
  state.witness = [1, state.out, state.x, state.y, v1];

  els.witnessVector.innerHTML = '';
  state.witness.forEach((val) => {
    const span = document.createElement('span');
    span.className = 'vec-element';
    span.textContent = val;
    els.witnessVector.appendChild(span);
  });

  els.witnessContainer.classList.remove('hidden');
  els.challengeBox.classList.remove('hidden');
  els.challengeValue.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Requesting Challenge...';

  // Interactive vs Fiat-Shamir logic
  if (state.isFiatShamir) {
    // Compute Hash locally
    setTimeout(() => {
      // Pseudo-hash the witness vector as commitment
      const rawHash = state.witness.reduce((acc, val) => acc + val * 13, 7);
      state.challenge = rawHash % PRIME;
      els.challengeValue.innerHTML = `Hash(Commitment) = <strong>${state.challenge}</strong> <span class="badge-fs">Fiat-Shamir</span>`;
      els.btnGenerateProof.disabled = false;
    }, 600);
  } else {
    // Wait for Verifier interaction ping
    els.networkAnim.classList.remove('hidden');
    els.animPacket.classList.add('reverse'); // Sending commit to verifier
    els.packetLabel.textContent = 'Sending Commitments...';

    setTimeout(() => {
      els.packetLabel.textContent = 'Waiting for Bob...';

      setTimeout(() => {
        els.animPacket.classList.remove('reverse');
        els.animPacket.classList.add('forward'); // Receiving challenge
        els.packetLabel.textContent = 'Receiving Random Challenge...';

        setTimeout(() => {
          els.networkAnim.classList.add('hidden');
          state.challenge = Math.floor(Math.random() * (PRIME - 1)) + 1; // Random 1..96
          els.challengeValue.innerHTML = `Random Challenge from Bob = <strong>${state.challenge}</strong>`;
          els.btnGenerateProof.disabled = false;
        }, 1500);
      }, 1000);
    }, 1500);
  }
}

function handleGenerateProof() {
  els.btnGenerateProof.disabled = true;
  els.btnGenerateProof.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating SNARK...';

  setTimeout(() => {
    els.btnGenerateProof.innerHTML = '<i class="fas fa-check"></i> Proof Generated';

    // Trigger Animation
    els.networkAnim.classList.remove('hidden');
    els.animPacket.className = 'packet forward pulse-packet';

    if (state.isFiatShamir) {
      els.packetLabel.innerHTML = 'Sending (Proof π + Hash) <i class="fas fa-bolt"></i>';
    } else {
      els.packetLabel.innerHTML = 'Sending Proof π';
    }

    // Update Verifier after animation completes
    setTimeout(() => {
      state.isProofGenerated = true;
      els.verifierOutput.textContent = state.out;
      els.verifierProofStatus.innerHTML = state.isFiatShamir
        ? 'Payload Received <i class="fas fa-link"></i>'
        : 'Proof π Received';
      els.verifierProofStatus.className = 'text-success';

      // Auto-verify in Fiat-Shamir, otherwise require click
      if (state.isFiatShamir) {
        handleVerification();
      } else {
        els.btnVerify.disabled = false;
      }

      els.btnGenerateProof.disabled = false;
      els.btnGenerateProof.innerHTML = '<i class="fas fa-magic"></i> Generate Cryptographic Proof';
      els.networkAnim.classList.add('hidden');
    }, 2000);
  }, 800);
}

// ==========================================
// 4. THE VERIFIER (Mathematical Checking)
// ==========================================

// Dot product of two vectors modulo P
function dotProductMod(vec1, vec2) {
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    sum = addMod(sum, mulMod(vec1[i], vec2[i]));
  }
  return sum;
}

function handleVerification() {
  if (!state.isProofGenerated) return;

  els.btnVerify.disabled = true;
  els.btnVerify.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
  els.verificationResults.classList.add('hidden');

  setTimeout(() => {
    // Mathematical Verification of R1CS: A.s * B.s == C.s
    const s = state.witness;

    // Gate 1 Check
    const a1 = dotProductMod(A[0], s);
    const b1 = dotProductMod(B[0], s);
    const c1 = dotProductMod(C[0], s);
    const isValid1 = mulMod(a1, b1) === c1;

    els.checkGate1.innerHTML = `(${a1} * ${b1}) mod 97 == ${c1} <i class="fas ${isValid1 ? 'fa-check valid-math' : 'fa-times invalid-math'}"></i>`;

    // Gate 2 Check
    const a2 = dotProductMod(A[1], s);
    const b2 = dotProductMod(B[1], s);
    const c2 = dotProductMod(C[1], s);
    const isValid2 = mulMod(a2, b2) === c2;

    els.checkGate2.innerHTML = `(${a2} * ${b2}) mod 97 == ${c2} <i class="fas ${isValid2 ? 'fa-check valid-math' : 'fa-times invalid-math'}"></i>`;

    // Final Verdict
    els.verificationResults.classList.remove('hidden');

    // Simulating the effect of Challenge `tau` on dot product
    const finalCheck1 = isValid1
      ? `✅ Equation holds (checked with τ=${state.challenge})`
      : '❌ Math Invalid';

    if (isValid1 && isValid2) {
      els.finalVerdict.className = 'verdict-box success';
      els.finalVerdict.innerHTML = `<i class="fas fa-shield-check"></i> PROOF VALID! ${state.isFiatShamir ? 'Non-Interactive verification successful.' : 'The prover knows the secret inputs.'}`;
    } else {
      els.finalVerdict.className = 'verdict-box error';
      els.finalVerdict.innerHTML =
        '<i class="fas fa-ban"></i> PROOF INVALID! The equations do not hold.';
    }

    els.btnVerify.disabled = false;
    els.btnVerify.innerHTML = '<i class="fas fa-check-double"></i> Run Verification';
  }, 1000);
}

// ==========================================
// 5. AMBIENT BACKGROUND CANVAS
// ==========================================
function initZKCanvas() {
  const canvas = document.getElementById('zkCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const symbols = ['π', 'Σ', 'τ', 'Hash', 'ℤp', 'mod', 'R1CS', 'QAP'];
  for (let i = 0; i < 40; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      alpha: Math.random() * 0.3 + 0.1,
    });
  }

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.font = 'bold 14px "Fira Code"';

    // Connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(168, 85, 247, ${((150 - dist) / 150) * 0.2})`;
          ctx.stroke();
        }
      }
    }

    // Particles
    particles.forEach((p) => {
      ctx.fillStyle = `rgba(16, 185, 129, ${p.alpha})`; // Emerald hue
      if (p.symbol === 'π' || p.symbol === 'τ') ctx.fillStyle = `rgba(236, 72, 153, ${p.alpha})`; // Pink hue
      ctx.fillText(p.symbol, p.x, p.y);

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
    });

    requestAnimationFrame(draw);
  };
  draw();
}
