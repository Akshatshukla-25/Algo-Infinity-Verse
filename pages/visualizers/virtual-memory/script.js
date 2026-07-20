class VirtualMemory {
  constructor() {
    this.pageTable = {};
    this.frames = [];
    this.tlb = [];
    this.pageFaults = 0;
    this.hits = 0;
    this.clockHand = 0;
    this.currentPage = 0;
    this.algorithm = 'fifo';
    this.framesCount = 4;
    this.pageSize = 4;
    this.logs = [];
  }

  init(framesCount, algorithm) {
    this.framesCount = framesCount;
    this.algorithm = algorithm;
    this.pageTable = {};
    this.frames = [];
    this.tlb = [];
    this.pageFaults = 0;
    this.hits = 0;
    this.clockHand = 0;
    this.currentPage = 0;
    this.logs = [];
    this.render();
  }

  accessPage(pageNum) {
    this.currentPage = pageNum;
    this.addLog(`Accessing page ${pageNum}`, 'info');
    
    // Check TLB
    if (this.tlb.includes(pageNum)) {
      this.hits++;
      this.addLog(`TLB hit! Page ${pageNum} found`, 'hit');
      this.render();
      return;
    }
    
    // Check page table
    if (this.pageTable[pageNum] !== undefined) {
      this.hits++;
      this.addLog(`Page ${pageNum} found in page table`, 'hit');
      // Update TLB
      if (!this.tlb.includes(pageNum)) {
        this.tlb.push(pageNum);
        if (this.tlb.length > 4) this.tlb.shift();
      }
      this.render();
      return;
    }
    
    // Page fault
    this.pageFaults++;
    this.addLog(`PAGE FAULT: Page ${pageNum} not in memory`, 'fault');
    
    // Page replacement
    if (this.frames.length < this.framesCount) {
      this.frames.push(pageNum);
      this.pageTable[pageNum] = this.frames.length - 1;
    } else {
      const replaced = this.replacePage(pageNum);
      this.addLog(`Replaced page ${replaced} with ${pageNum}`, 'info');
    }
    
    // Update TLB
    this.tlb.push(pageNum);
    if (this.tlb.length > 4) this.tlb.shift();
    
    this.render();
  }

  replacePage(pageNum) {
    let replaced = -1;
    
    if (this.algorithm === 'fifo') {
      replaced = this.frames[0];
      this.frames.shift();
      this.frames.push(pageNum);
    } else if (this.algorithm === 'lru') {
      // Simple LRU: remove from end
      replaced = this.frames[this.frames.length - 1];
      this.frames.pop();
      this.frames.push(pageNum);
    } else if (this.algorithm === 'clock') {
      // Clock algorithm
      while (true) {
        const idx = this.clockHand % this.frames.length;
        if (this.frames[idx] === -1) {
          replaced = this.frames[idx];
          this.frames[idx] = pageNum;
          this.clockHand = (idx + 1) % this.frames.length;
          break;
        }
        this.clockHand++;
      }
    }
    
    // Remove from page table
    for (const [key, val] of Object.entries(this.pageTable)) {
      if (val === this.frames.indexOf(replaced)) {
        delete this.pageTable[key];
        break;
      }
    }
    this.pageTable[pageNum] = this.frames.indexOf(pageNum);
    
    return replaced;
  }

  addLog(msg, type = 'info') {
    this.logs.push({ msg, type });
    if (this.logs.length > 50) this.logs.shift();
  }

  render() {
    // Render page table
    const tableEl = document.getElementById('pageTable');
    tableEl.innerHTML = '';
    for (let i = 0; i < 16; i++) {
      const div = document.createElement('div');
      div.className = 'page-entry';
      if (this.pageTable[i] !== undefined) {
        div.classList.add('present');
        div.textContent = `P${i} → F${this.pageTable[i]}`;
      } else {
        div.textContent = `P${i}`;
      }
      tableEl.appendChild(div);
    }

    // Render frames
    const framesEl = document.getElementById('framesContainer');
    framesEl.innerHTML = '';
    for (let i = 0; i < this.framesCount; i++) {
      const div = document.createElement('div');
      div.className = 'frame';
      if (i < this.frames.length) {
        div.textContent = `P${this.frames[i]}`;
      } else {
        div.classList.add('empty');
        div.textContent = 'Empty';
      }
      framesEl.appendChild(div);
    }

    // Render TLB
    const tlbEl = document.getElementById('tlb');
    tlbEl.innerHTML = this.tlb.map(p => 
      `<span class="tlb-entry">P${p}</span>`
    ).join('');

    // Render translation
    const transEl = document.getElementById('translation');
    transEl.innerHTML = `
      Virtual Address: Page ${this.currentPage}<br>
      Page Table Entry: ${this.pageTable[this.currentPage] !== undefined ? `Frame ${this.pageTable[this.currentPage]}` : 'Not in memory'}<br>
      Physical Address: ${this.pageTable[this.currentPage] !== undefined ? `Frame ${this.pageTable[this.currentPage]}` : 'Page Fault!'}
    `;

    // Render stats
    document.getElementById('faults').textContent = this.pageFaults;
    document.getElementById('hits').textContent = this.hits;
    const total = this.pageFaults + this.hits;
    document.getElementById('hitRatio').textContent = total > 0 ? `${Math.round((this.hits / total) * 100)}%` : '0%';

    // Render log
    const logEl = document.getElementById('log');
    logEl.innerHTML = this.logs.slice(-10).map(l => 
      `<div class="log-entry ${l.type}">${l.msg}</div>`
    ).join('');
  }
}

// Initialize
const vm = new VirtualMemory();
let simulationRunning = false;
let simulationInterval = null;

document.addEventListener('DOMContentLoaded', function() {
  vm.init(4, 'fifo');

  document.getElementById('runBtn').addEventListener('click', function() {
    if (simulationRunning) {
      clearInterval(simulationInterval);
      simulationRunning = false;
      this.textContent = '▶️ Run Simulation';
      return;
    }
    
    simulationRunning = true;
    this.textContent = '⏹️ Stop';
    
    const pages = [0, 1, 2, 3, 0, 4, 2, 3, 1, 5, 6, 2, 0, 3, 4];
    let idx = 0;
    
    simulationInterval = setInterval(() => {
      if (idx < pages.length) {
        vm.accessPage(pages[idx]);
        idx++;
      } else {
        clearInterval(simulationInterval);
        simulationRunning = false;
        document.getElementById('runBtn').textContent = '▶️ Run Simulation';
      }
    }, 800);
  });

  document.getElementById('stepBtn').addEventListener('click', function() {
    const pages = [0, 1, 2, 3, 0, 4, 2, 3, 1, 5];
    const idx = vm.logs.length % pages.length;
    vm.accessPage(pages[idx]);
  });

  document.getElementById('resetBtn').addEventListener('click', function() {
    if (simulationRunning) {
      clearInterval(simulationInterval);
      simulationRunning = false;
      document.getElementById('runBtn').textContent = '▶️ Run Simulation';
    }
    const frames = parseInt(document.getElementById('frames').value) || 4;
    const algo = document.getElementById('algorithm').value;
    vm.init(frames, algo);
  });

  document.getElementById('algorithm').addEventListener('change', function() {
    const frames = parseInt(document.getElementById('frames').value) || 4;
    vm.init(frames, this.value);
  });

  document.getElementById('frames').addEventListener('change', function() {
    const frames = parseInt(this.value) || 4;
    const algo = document.getElementById('algorithm').value;
    vm.init(frames, algo);
  });
});