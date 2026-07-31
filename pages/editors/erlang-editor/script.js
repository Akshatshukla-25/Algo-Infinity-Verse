document.addEventListener('DOMContentLoaded', function() {
  const codeInput = document.getElementById('codeInput');
  const output = document.getElementById('output');
  const runBtn = document.getElementById('runBtn');
  const clearBtn = document.getElementById('clearBtn');
  const exampleBtn = document.getElementById('exampleBtn');
  const status = document.getElementById('status');

  const examples = {
    hello: `% Hello World
-module(hello).
-export([hello/0]).

hello() ->
    io:format("Hello, World!~n").`,

    factorial: `% Factorial
-module(math).
-export([factorial/1]).

factorial(0) -> 1;
factorial(N) when N > 0 -> N * factorial(N - 1).`,

    fibonacci: `% Fibonacci
-module(fib).
-export([fib/1]).

fib(0) -> 0;
fib(1) -> 1;
fib(N) -> fib(N-1) + fib(N-2).`,

    server: `% Simple Server
-module(server).
-export([start/0, loop/0]).

start() ->
    spawn(fun loop/0).

loop() ->
    receive
        {ping, From} ->
            From ! pong,
            loop()
    end.`
  };

  exampleBtn.addEventListener('click', function() {
    const keys = Object.keys(examples);
    const random = keys[Math.floor(Math.random() * keys.length)];
    codeInput.value = examples[random];
  });

  clearBtn.addEventListener('click', function() {
    codeInput.value = '';
    output.textContent = '';
  });

  runBtn.addEventListener('click', function() {
    const code = codeInput.value.trim();
    if (!code) {
      output.textContent = '⚠️ Please enter some code';
      return;
    }

    status.textContent = '⏳ Running...';
    output.textContent = '';

    setTimeout(() => {
      let result = '📤 Output:\n\n';
      const lines = code.split('\n');
      
      // Extract function names
      const funcs = [];
      lines.forEach(line => {
        const match = line.match(/-export\(\[(.+)\/\]\)/);
        if (match) {
          funcs.push(match[1]);
        }
      });

      // Simulate execution
      if (code.includes('hello')) {
        result += 'Hello, World!\n';
      }
      if (code.includes('factorial')) {
        result += 'factorial(5) = 120\n';
      }
      if (code.includes('fib')) {
        result += 'fib(10) = 55\n';
      }
      if (code.includes('server')) {
        result += 'Server started (pid: <0.42.0>)\n';
        result += 'Ready to receive messages\n';
      }
      
      if (funcs.length) {
        result += `\nExported functions: ${funcs.join(', ')}\n`;
      }
      
      result += `\n✅ Execution complete`;
      output.textContent = result;
      status.textContent = '✅ Done';
    }, 500);
  });

  // Load initial example
  codeInput.value = examples.hello;
});