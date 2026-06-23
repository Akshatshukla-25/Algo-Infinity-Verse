// ====== CODE EXECUTOR ENGINE ======
class CodeExecutor {
    constructor(code) {
        this.code = code;
        this.lines = code.split('\n').map((line, i) => ({
            number: i + 1,
            text: line,
            trimmed: line.trim()
        }));
        this.variables = {};
        this.trace = [];
        this.output = [];
        this.currentLine = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.isFinished = false;
        this.originalConsoleLog = console.log;
    }

    // Step forward one line
    stepForward() {
        if (this.isFinished || this.currentLine >= this.lines.length) {
            this.isFinished = true;
            this.addTrace('⏹️ Execution complete!');
            this.updateStatus('Finished');
            return false;
        }

        const line = this.lines[this.currentLine];
        const trimmed = line.trimmed;

        // Skip empty lines
        if (!trimmed || trimmed.startsWith('//')) {
            this.addTrace(`⏭️ Skipped: "${trimmed || 'empty line'}"`);
            this.currentLine++;
            return this.stepForward();
        }

        this.addTrace(`▶️ Executing line ${line.number}: "${trimmed}"`);

        try {
            // Execute the line
            this.executeLine(trimmed);
            this.updateStatus(`Line ${line.number} executed`);
            this.currentLine++;
            this.highlightLine(this.currentLine);
            this.updateVariables();

            // Check if finished
            if (this.currentLine >= this.lines.length) {
                this.isFinished = true;
                this.addTrace('✅ Execution complete!');
                this.updateStatus('Finished');
            }

            return true;
        } catch (error) {
            this.addTrace(`❌ Error: ${error.message}`);
            this.updateStatus('Error');
            this.isFinished = true;
            return false;
        }
    }

    // Execute a single line
    executeLine(line) {
        // Handle console.log
        if (line.startsWith('console.log(')) {
            const match = line.match(/console\.log\((.*)\)/);
            if (match) {
                const args = match[1].split(',').map(arg => {
                    const trimmedArg = arg.trim();
                    // Check if it's a variable
                    if (this.variables[trimmedArg] !== undefined) {
                        return this.variables[trimmedArg];
                    }
                    // Check if it's a string
                    if (trimmedArg.startsWith('"') || trimmedArg.startsWith("'")) {
                        return trimmedArg.slice(1, -1);
                    }
                    // Check if it's a number
                    if (!isNaN(trimmedArg)) {
                        return Number(trimmedArg);
                    }
                    return trimmedArg;
                });
                const output = args.join(' ');
                this.output.push(output);
                this.addTrace(`📤 Output: ${output}`);
                // Also show in console
                console.log(output);
                return;
            }
        }

        // Handle variable declaration with let
        if (line.startsWith('let ')) {
            const parts = line.replace('let ', '').split('=');
            const varName = parts[0].trim();
            let value = parts.length > 1 ? parts[1].trim() : undefined;
            
            if (value !== undefined) {
                // Check if value is a number
                if (!isNaN(value)) {
                    value = Number(value);
                }
                // Check if value is another variable
                else if (this.variables[value] !== undefined) {
                    value = this.variables[value];
                }
            }
            
            this.variables[varName] = value;
            this.addTrace(`📦 ${varName} = ${value !== undefined ? value : 'undefined'}`);
            return;
        }

        // Handle variable assignment (no let)
        const assignmentMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)/);
        if (assignmentMatch) {
            const varName = assignmentMatch[1];
            let value = assignmentMatch[2].trim();
            
            // Check if value is a number
            if (!isNaN(value)) {
                value = Number(value);
            }
            // Check if value is another variable
            else if (this.variables[value] !== undefined) {
                value = this.variables[value];
            }
            
            this.variables[varName] = value;
            this.addTrace(`📦 ${varName} = ${value}`);
            return;
        }

        // Handle simple expressions (e.g., x + y)
        const exprMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\+\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (exprMatch) {
            const varName = exprMatch[1];
            const left = exprMatch[2];
            const right = exprMatch[3];
            
            if (this.variables[left] !== undefined && this.variables[right] !== undefined) {
                this.variables[varName] = this.variables[left] + this.variables[right];
                this.addTrace(`📦 ${varName} = ${this.variables[left]} + ${this.variables[right]} = ${this.variables[varName]}`);
                return;
            }
        }

        // If we get here, we don't know how to execute the line
        this.addTrace(`⚠️ Unknown command: "${line}"`);
    }

    // Add to trace
    addTrace(message) {
        this.trace.push({
            line: this.currentLine + 1,
            message: message,
            time: new Date().toISOString()
        });
        updateTraceUI(this.trace);
    }

    // Update status
    updateStatus(status) {
        document.getElementById('statusText').textContent = `⏹️ ${status}`;
    }

    // Highlight current line
    highlightLine(lineNumber) {
        if (lineNumber <= 0) {
            highlightLine.style.display = 'none';
            return;
        }
        const lineHeight = 1.6 * 16; // ~25.6px
        const top = (lineNumber - 1) * lineHeight;
        highlightLine.style.top = `${top}px`;
        highlightLine.style.display = 'block';
        document.getElementById('lineStatus').textContent = `Line: ${lineNumber}`;
    }

    // Update variables UI
    updateVariables() {
        updateVariablesUI(this.variables);
    }

    // Run all code
    runAll() {
        this.reset();
        this.isRunning = true;
        this.updateStatus('Running...');
        while (!this.isFinished && this.currentLine < this.lines.length) {
            const result = this.stepForward();
            if (!result) break;
        }
        this.isRunning = false;
    }

    // Reset everything
    reset() {
        this.variables = {};
        this.trace = [];
        this.output = [];
        this.currentLine = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.isFinished = false;
        this.highlightLine(0);
        this.updateVariables();
        updateTraceUI([]);
        updateConsoleUI([]);
        this.updateStatus('Ready');
        console.log = this.originalConsoleLog;
    }

    // Get the code lines
    getLines() {
        return this.lines;
    }
}

// ====== UI UPDATE FUNCTIONS ======

// Update variables UI
function updateVariablesUI(variables) {
    const container = document.getElementById('variablesContainer');
    const keys = Object.keys(variables);
    
    if (keys.length === 0) {
        container.innerHTML = '<div class="empty-state">No variables yet. Run some code!</div>';
        return;
    }

    let html = '';
    for (const key of keys) {
        const value = variables[key];
        const displayValue = typeof value === 'string' ? `"${value}"` : value;
        html += `
            <div class="variable-item">
                <span class="variable-name">${key}</span>
                <span class="variable-value">${displayValue !== undefined ? displayValue : 'undefined'}</span>
            </div>
        `;
    }
    container.innerHTML = html;
}

// Update trace UI
function updateTraceUI(trace) {
    const container = document.getElementById('traceContainer');
    
    if (trace.length === 0) {
        container.innerHTML = '<div class="empty-state">Trace will appear here...</div>';
        return;
    }

    let html = '';
    for (const item of trace) {
        const isError = item.message.includes('❌') || item.message.includes('Error');
        const isActive = item.message.includes('▶️');
        html += `
            <div class="trace-item ${isActive ? 'active' : ''}" style="${isError ? 'color: #ef4444;' : ''}">
                ${item.message}
            </div>
        `;
    }
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

// Update console UI
function updateConsoleUI(output) {
    const container = document.getElementById('outputConsole');
    
    if (output.length === 0) {
        container.innerHTML = '<div class="empty-state">Output will appear here...</div>';
        return;
    }

    let html = '';
    for (const line of output) {
        html += `<div class="log-line">> ${line}</div>`;
    }
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

// ====== SETUP EXECUTOR ======

let executor = null;

// Get code from editor
function getCodeFromEditor() {
    return document.getElementById('codeEditor').value;
}

// Initialize executor
function initExecutor() {
    const code = getCodeFromEditor();
    executor = new CodeExecutor(code);
    executor.highlightLine(0);
    return executor;
}

// ====== BUTTON HANDLERS ======

// Run
document.getElementById('runBtn').addEventListener('click', () => {
    if (!executor) initExecutor();
    executor.runAll();
    updateConsoleUI(executor.output);
});

// Step
document.getElementById('stepBtn').addEventListener('click', () => {
    if (!executor) initExecutor();
    executor.stepForward();
    updateConsoleUI(executor.output);
    updateVariablesUI(executor.variables);
});

// Reset
document.getElementById('resetBtn').addEventListener('click', () => {
    if (!executor) initExecutor();
    executor.reset();
    updateConsoleUI([]);
    updateVariablesUI({});
});

// ====== DARK MODE TOGGLE ======
// Add dark mode toggle to navbar if you want
// Simple keyboard shortcut: press 'd' to toggle
document.addEventListener('keydown', (e) => {
    if (e.key === 'd' && e.ctrlKey) {
        document.body.classList.toggle('dark-mode');
    }
});

// ====== INITIAL SETUP ======
document.addEventListener('DOMContentLoaded', () => {
    // Set default code
    const editor = document.getElementById('codeEditor');
    editor.value = defaultCode;
    updateLineNumbers();
    
    // Initialize executor
    initExecutor();
    
    // Show initial state
    updateVariablesUI({});
    updateTraceUI([]);
    updateConsoleUI([]);
});

// ====== UPDATE LINE NUMBERS (from editor.js) ======
function updateLineNumbers() {
    const lines = document.getElementById('codeEditor').value.split('\n');
    const count = lines.length;
    let html = '';
    for (let i = 1; i <= count; i++) {
        html += `<span>${i}</span>`;
    }
    document.getElementById('lineNumbers').innerHTML = html;
}

// Re-initialize when code changes
document.getElementById('codeEditor').addEventListener('input', () => {
    if (executor) {
        executor.reset();
        initExecutor();
        updateVariablesUI({});
        updateTraceUI([]);
        updateConsoleUI([]);
    }
});

window.addEventListener("resize", () => {
  if (typeof updateLineNumbers === 'function') updateLineNumbers();
});
