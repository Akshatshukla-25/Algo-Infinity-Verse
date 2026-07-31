class LWWElementSet {
  constructor() {
    this.addSet = new Map(); // item -> timestamp
    this.removeSet = new Map(); // item -> timestamp
  }

  add(item, timestamp = Date.now()) {
    if (!this.addSet.has(item) || this.addSet.get(item) < timestamp) {
      this.addSet.set(item, timestamp);
    }
  }

  remove(item, timestamp = Date.now()) {
    if (!this.removeSet.has(item) || this.removeSet.get(item) < timestamp) {
      this.removeSet.set(item, timestamp);
    }
  }

  lookup() {
    const result = [];
    for (const [item, addTimestamp] of this.addSet.entries()) {
      const removeTimestamp = this.removeSet.get(item);
      if (removeTimestamp === undefined || addTimestamp > removeTimestamp) {
        result.push(item);
      }
    }
    // Sort results alphabetically for consistent display
    return result.sort();
  }

  merge(otherSet) {
    for (const [item, timestamp] of otherSet.addSet.entries()) {
      if (!this.addSet.has(item) || this.addSet.get(item) < timestamp) {
        this.addSet.set(item, timestamp);
      }
    }
    for (const [item, timestamp] of otherSet.removeSet.entries()) {
      if (!this.removeSet.has(item) || this.removeSet.get(item) < timestamp) {
        this.removeSet.set(item, timestamp);
      }
    }
  }

  clone() {
    const clone = new LWWElementSet();
    clone.addSet = new Map(this.addSet);
    clone.removeSet = new Map(this.removeSet);
    return clone;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  let isConnected = true;
  let clientA = new LWWElementSet();
  let clientB = new LWWElementSet();
  let clock = 1;

  // Initial population for demonstration
  clientA.add('Apple', clock++);
  clientA.add('Banana', clock++);

  syncClients(); // Ensure B gets them too

  // DOM Elements
  const toggle = document.getElementById('networkToggle');
  const statusText = document.getElementById('networkStatusText');
  const btnSync = document.getElementById('btnSync');
  const connectionLine = document.getElementById('connectionLine');
  const wifiIcon = document.getElementById('wifiIcon');

  const btnAddA = document.getElementById('btnAddA');
  const inputA = document.getElementById('inputA');
  const addSetA_UL = document.getElementById('addSetA');
  const removeSetA_UL = document.getElementById('removeSetA');
  const resultA_UL = document.getElementById('resultA');

  const btnAddB = document.getElementById('btnAddB');
  const inputB = document.getElementById('inputB');
  const addSetB_UL = document.getElementById('addSetB');
  const removeSetB_UL = document.getElementById('removeSetB');
  const resultB_UL = document.getElementById('resultB');

  // Network Toggle
  toggle.addEventListener('change', (e) => {
    isConnected = e.target.checked;
    if (isConnected) {
      statusText.textContent = 'Network: Connected';
      btnSync.style.display = 'none';
      connectionLine.classList.remove('disconnected');
      wifiIcon.className = 'fas fa-wifi';
      syncClients();
      if (window.toast) window.toast.success('Network reconnected! State merged seamlessly.');
    } else {
      statusText.textContent = 'Network: Disconnected';
      btnSync.style.display = 'block';
      connectionLine.classList.add('disconnected');
      wifiIcon.className = 'fas fa-plane';
      if (window.toast) window.toast.warning('Network disconnected! Clients can now diverge.');
    }
  });

  btnSync.addEventListener('click', () => {
    syncClients();
    if (window.toast) window.toast.success('State manually synced and merged!');
  });

  // Client A Actions
  btnAddA.addEventListener('click', () => {
    const val = inputA.value.trim();
    if (val) {
      clientA.add(val, clock++);
      inputA.value = '';
      if (isConnected) syncClients();
      else updateUI();
    }
  });
  inputA.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btnAddA.click();
  });

  // Client B Actions
  btnAddB.addEventListener('click', () => {
    const val = inputB.value.trim();
    if (val) {
      clientB.add(val, clock++);
      inputB.value = '';
      if (isConnected) syncClients();
      else updateUI();
    }
  });
  inputB.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btnAddB.click();
  });

  function removeA(item) {
    clientA.remove(item, clock++);
    if (isConnected) syncClients();
    else updateUI();
  }

  function removeB(item) {
    clientB.remove(item, clock++);
    if (isConnected) syncClients();
    else updateUI();
  }

  function syncClients() {
    const merged = new LWWElementSet();
    merged.merge(clientA);
    merged.merge(clientB);
    clientA = merged.clone();
    clientB = merged.clone();
    updateUI();
  }

  function renderMapToUL(map, ulElement) {
    ulElement.innerHTML = '';
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    for (const [item, ts] of sorted) {
      const li = document.createElement('li');
      li.innerHTML = `<span>${item}</span> <span class="timestamp">ts:${ts}</span>`;
      ulElement.appendChild(li);
    }
  }

  function renderResult(client, ulElement, removeFn) {
    ulElement.innerHTML = '';
    const items = client.lookup();
    for (const item of items) {
      const li = document.createElement('li');

      const span = document.createElement('span');
      span.textContent = item;
      li.appendChild(span);

      const btn = document.createElement('button');
      btn.className = 'btn-remove';
      btn.innerHTML = '<i class="fas fa-trash"></i>';
      btn.onclick = () => removeFn(item);
      li.appendChild(btn);

      ulElement.appendChild(li);
    }
  }

  function updateUI() {
    renderMapToUL(clientA.addSet, addSetA_UL);
    renderMapToUL(clientA.removeSet, removeSetA_UL);
    renderResult(clientA, resultA_UL, removeA);

    renderMapToUL(clientB.addSet, addSetB_UL);
    renderMapToUL(clientB.removeSet, removeSetB_UL);
    renderResult(clientB, resultB_UL, removeB);
  }

  // Initial Sync
  updateUI();
});
