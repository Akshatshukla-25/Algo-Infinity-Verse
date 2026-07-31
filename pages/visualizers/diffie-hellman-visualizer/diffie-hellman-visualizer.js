/**
 * diffie-hellman-visualizer.js
 * Simulate the Diffie-Hellman Key Exchange math and colors.
 * eslint-disable no-unused-vars
 */
/* eslint-disable no-unused-vars */

document.addEventListener('DOMContentLoaded', () => {
  initDH();
});

const els = {
  btnNext: document.getElementById('btnNextStep'),
  modeToggle: document.getElementById('modeToggle'),
  modeLabel: document.getElementById('modeLabel'),

  mathVals: document.querySelectorAll('.math-val'),
  colorVals: document.querySelectorAll('.color-val'),

  aliceCalc: document.querySelector('#aliceMixBox .calc-text'),
  aliceCalcColor: document.querySelector('#aliceMixBox .calc-color'),
  aliceResult: document.querySelector('#aliceResultBox .final-text'),
  aliceResultColor: document.querySelector('#aliceResultBox .final-color'),

  bobCalc: document.querySelector('#bobMixBox .calc-text'),
  bobCalcColor: document.querySelector('#bobMixBox .calc-color'),
  bobResult: document.querySelector('#bobResultBox .final-text'),
  bobResultColor: document.querySelector('#bobResultBox .final-color'),

  eveLog: document.getElementById('eveTrafficLog'),
  eveConclusion: document.getElementById('eveConclusion'),
};

// Math Parameters
const P = 23; // Prime
const G = 5; // Base
const a = 6; // Alice Secret
const b = 15; // Bob Secret

// Colors (Hex)
const C_PUB = '#f59e0b'; // Yellow (Public Base)
const C_ALICE = '#ef4444'; // Red (Alice Secret)
const C_BOB = '#3b82f6'; // Blue (Bob Secret)
const C_MIX_A = '#f97316'; // Orange (Alice Mixed)
const C_MIX_B = '#10b981'; // Green (Bob Mixed)
const C_SECRET = '#a855f7'; // Purple (Final Shared)

let step = 0;
let isColorMode = false;

function initDH() {
  els.btnNext.addEventListener('click', nextStep);
  els.modeToggle.addEventListener('change', toggleMode);
}

function toggleMode() {
  isColorMode = els.modeToggle.checked;

  if (isColorMode) {
    els.modeLabel.innerHTML = 'Mode: <strong>Colors</strong> (Analogy)';
    els.mathVals.forEach((el) => el.classList.add('hidden'));
    els.colorVals.forEach((el) => el.classList.remove('hidden'));
  } else {
    els.modeLabel.innerHTML = 'Mode: <strong>Math</strong> (g^a mod p)';
    els.colorVals.forEach((el) => el.classList.add('hidden'));
    els.mathVals.forEach((el) => el.classList.remove('hidden'));
  }
}

function logEve(msg, modeMsg) {
  const empty = els.eveLog.querySelector('.empty');
  if (empty) empty.remove();

  const div = document.createElement('div');
  div.className = 'log-entry';
  div.innerHTML = isColorMode ? modeMsg : msg;
  els.eveLog.appendChild(div);
}

// Math modPow
function modPow(base, exp, mod) {
  let res = 1;
  base = base % mod;
  while (exp > 0) {
    if (exp % 2 === 1) res = (res * base) % mod;
    exp = Math.floor(exp / 2);
    base = (base * base) % mod;
  }
  return res;
}

function nextStep() {
  step++;

  if (step === 1) {
    // Step 1: Calculate Public Mixes
    const A = modPow(G, a, P); // 5^6 mod 23 = 8
    const B = modPow(G, b, P); // 5^15 mod 23 = 19

    // Math Update
    els.aliceCalc.textContent = `A = ${G}^${a} mod ${P} = ${A}`;
    els.bobCalc.textContent = `B = ${G}^${b} mod ${P} = ${B}`;

    // Color Update
    els.aliceCalcColor.style.backgroundColor = C_MIX_A;
    els.bobCalcColor.style.backgroundColor = C_MIX_B;

    els.btnNext.innerHTML = 'Exchange Over Public Channel <i class="fas fa-paper-plane"></i>';
  } else if (step === 2) {
    // Step 2: Exchange (Eve intercepts)
    const A = modPow(G, a, P);
    const B = modPow(G, b, P);

    logEve(
      `Intercepted <strong>A = ${A}</strong> from Alice.<br>Intercepted <strong>B = ${B}</strong> from Bob.`,
      `Intercepted <span style="color:${C_MIX_A}">Orange Mixture</span> from Alice.<br>Intercepted <span style="color:${C_MIX_B}">Green Mixture</span> from Bob.`
    );

    els.btnNext.innerHTML = 'Calculate Final Shared Secret <i class="fas fa-lock"></i>';
  } else if (step === 3) {
    // Step 3: Calculate Final Secret
    const A = modPow(G, a, P);
    const B = modPow(G, b, P);

    const sAlice = modPow(B, a, P); // 19^6 mod 23 = 2
    const sBob = modPow(A, b, P); // 8^15 mod 23 = 2

    // Math Update
    els.aliceResult.innerHTML = `s = ${B}^${a} mod ${P} = <span style="color:#a855f7">${sAlice}</span>`;
    els.bobResult.innerHTML = `s = ${A}^${b} mod ${P} = <span style="color:#a855f7">${sBob}</span>`;

    // Color Update
    els.aliceResultColor.style.backgroundColor = C_SECRET;
    els.bobResultColor.style.backgroundColor = C_SECRET;

    // Eve Conclusion
    els.eveConclusion.classList.add('visible');

    els.btnNext.innerHTML = '<i class="fas fa-check"></i> Exchange Complete';
    els.btnNext.disabled = true;
  }
}
