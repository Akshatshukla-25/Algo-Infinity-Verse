// ─── Curriculum Data ───
const curriculum = [
  {
    id: 'express-basics',
    title: 'Express Basics & Routing',
    lessons: [
      {
        id: 'eb-1',
        title: 'Hello Express',
        objectives: [
          'Understand what Express.js is and why it is used',
          'Create a basic Express server with app.listen()',
          'Define GET routes with route handlers',
          'Send responses using res.send() and res.json()',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Your First Express Server</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. It is a layer built on top of Node.js's built-in <code>http</code> module that simplifies routing, middleware integration, and request/response handling.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600 font-semibold">// Basic Express server setup</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> express = <span class="text-blue-600">require</span>(<span class="text-green-600">'express'</span>);</p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> app = express();</p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> port = <span class="text-orange-500">3000</span>;</p>
            <p class="text-gray-700 mb-3">app.<span class="text-purple-600">get</span>(<span class="text-green-600">'/'</span>, (req, res) => { res.<span class="text-purple-600">send</span>(<span class="text-green-600">'Hello World!'</span>); });</p>
            <p class="text-gray-700">app.<span class="text-purple-600">listen</span>(port, () => <span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(<span class="text-green-600">'Server on port ' + port</span>));</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">Routing refers to determining how an application responds to a client request to a particular endpoint, which is a URI (or path) and a specific HTTP request method (GET, POST, and so on).</p>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium">Head over to the API Simulator tab, start the server, and send a GET request to <code>/</code> or <code>/api/users</code> to see Express in action!</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();
const port = 3000;

// Basic GET route
app.get('/', (req, res) => {
  console.log("Received GET request at /");
  res.send('Hello World!');
});

// JSON API route
app.get('/api/users', (req, res) => {
  console.log("Fetching users from database...");
  res.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ]);
});

app.listen(port, () => {
  console.log('Example app listening on port ' + port);
});`,
        takeaways: [
          'Express is a minimal Node.js framework for building web servers and APIs',
          'app.get() registers a route handler for GET requests',
          'res.send() sends plain text, res.json() sends JSON responses',
          'app.listen() starts the server on a specified port',
        ],
      },
      {
        id: 'eb-2',
        title: 'Route Parameters and Query Strings',
        objectives: [
          'Extract dynamic values from URLs using route parameters',
          'Access query string parameters from the request',
          'Combine params and query strings in a single route',
          'Understand the difference between params and query strings',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Dynamic Routing</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Real applications need dynamic routes. A route like <code>/users/42</code> should show user 42, not a static page. Express uses <strong>route parameters</strong> (prefixed with <code>:</code>) to capture values from the URL path.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Route parameter :id captures the value from the URL</span></p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">get</span>(<span class="text-green-600">'/users/:id'</span>, (req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">const</span> userId = req.<span class="text-purple-600">params</span>.id;</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;res.<span class="text-purple-600">json</span>({ userId });</p>
            <p class="text-gray-700 mb-3">});</p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">// Query string: /search?q=express&page=2</span></p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">get</span>(<span class="text-green-600">'/search'</span>, (req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">const</span> query = req.<span class="text-purple-600">query</span>.q;</p>
            <p class="text-gray-700">&nbsp;&nbsp;res.<span class="text-purple-600">json</span>({ query, page: req.query.page });</p>
            <p class="text-gray-700">});</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Route params</strong> (<code>req.params</code>) are part of the URL path — they identify a <em>specific resource</em>. <strong>Query strings</strong> (<code>req.query</code>) appear after <code>?</code> in the URL and provide <em>additional options</em> like filtering, sorting, or pagination.</p>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>Best Practice:</strong> Use route params for required identifiers and query strings for optional modifiers. For example: <code>GET /users/42?includePosts=true</code></p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();

// Route parameter example
app.get('/users/:id', (req, res) => {
  console.log('Fetching user ' + req.params.id);
  res.json({ userId: req.params.id, name: 'User ' + req.params.id });
});

// Multiple params
app.get('/users/:userId/posts/:postId', (req, res) => {
  res.json({
    userId: req.params.userId,
    postId: req.params.postId
  });
});

// Query string example
app.get('/search', (req, res) => {
  const query = req.query.q || 'none';
  const page = req.query.page || 1;
  console.log('Search: "' + query + '" page ' + page);
  res.json({ query, page });
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'Route params (:id) capture dynamic segments of the URL path',
          'Access params via req.params, query strings via req.query',
          'Multiple route params can be combined in a single path',
          'Query strings are optional and great for filtering/pagination',
        ],
      },
      {
        id: 'eb-3',
        title: 'Modular Routing with Express Router',
        objectives: [
          'Create modular route handlers using express.Router()',
          'Mount routers on specific base paths with app.use()',
          'Organize code into separate route files for maintainability',
          'Understand how path mounting affects route resolution',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Keeping Routes Organized</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">As your app grows, putting all routes in one file becomes unmanageable. Express provides <code>express.Router()</code> — a mini Express app that handles a group of related routes.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Create a router for user endpoints</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> userRouter = express.<span class="text-purple-600">Router</span>();</p>
            <p class="text-gray-700 mb-1">userRouter.<span class="text-purple-600">get</span>(<span class="text-green-600">'/'</span>, (req, res) => { ... });</p>
            <p class="text-gray-700 mb-1">userRouter.<span class="text-purple-600">get</span>(<span class="text-green-600">'/:id'</span>, (req, res) => { ... });</p>
            <p class="text-gray-700 mb-3">userRouter.<span class="text-purple-600">post</span>(<span class="text-green-600">'/'</span>, (req, res) => { ... });</p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">// Mount the router on a base path</span></p>
            <p class="text-gray-700">app.<span class="text-purple-600">use</span>(<span class="text-green-600">'/users'</span>, userRouter);</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">When you mount a router with <code>app.use('/users', userRouter)</code>, the router's paths are <strong>relative</strong> to that mount point. A route <code>'/'</code> inside the router becomes <code>/users/</code>, and <code>'/:id'</code> becomes <code>/users/:id</code>.</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Pro Tip:</strong> In production, put each router in its own file (<code>routes/users.js</code>, <code>routes/products.js</code>) and require them into your main app. This keeps your codebase clean and scalable.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();

// User router
const userRouter = express.Router();
userRouter.get('/', (req, res) => {
  console.log('GET /users');
  res.json([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);
});
userRouter.get('/:id', (req, res) => {
  console.log('GET /users/' + req.params.id);
  res.json({ id: req.params.id, name: 'User ' + req.params.id });
});
userRouter.post('/', (req, res) => {
  console.log('POST /users');
  res.status(201).json({ message: 'User created' });
});

// Product router
const productRouter = express.Router();
productRouter.get('/', (req, res) => {
  res.json([{ id: 1, product: 'Laptop' }, { id: 2, product: 'Phone' }]);
});

// Mount routers
app.use('/users', userRouter);
app.use('/products', productRouter);

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'express.Router() creates modular, mountable route handlers',
          'Routers can be mounted on any base path using app.use()',
          'Routes inside a router are relative to the mount point',
          'Routers help organize code as your application scales',
        ],
      },
      {
        id: 'eb-4',
        title: 'Serving Static Files',
        objectives: [
          'Serve static files like HTML, CSS, and images using express.static()',
          'Understand how express.static() maps URLs to filesystem paths',
          'Use multiple static directories for different file types',
          'Set a virtual path prefix for static files',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Static File Serving</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Most applications need to serve static assets — HTML files, CSS stylesheets, client-side JavaScript, images, and more. Instead of writing a route for each file, Express provides a built-in middleware: <code>express.static()</code>.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Serve files from the "public" directory</span></p>
            <p class="text-gray-700 mb-3">app.<span class="text-purple-600">use</span>(express.<span class="text-purple-600">static</span>(<span class="text-green-600">'public'</span>));</p>
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// With a virtual path prefix</span></p>
            <p class="text-gray-700">app.<span class="text-purple-600">use</span>(<span class="text-green-600">'/static'</span>, express.<span class="text-purple-600">static</span>(<span class="text-green-600">'public'</span>));</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">With <code>express.static('public')</code>, a file at <code>public/images/cat.jpg</code> is served at <code>/images/cat.jpg</code>. Adding a path prefix like <code>'/static'</code> means the same file would be served at <code>/static/images/cat.jpg</code>.</p>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>Security Note:</strong> Never put sensitive files (like <code>.env</code>, <code>node_modules</code>, or database backups) inside a static directory. Everything in a static folder is publicly accessible!</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();
const path = require('path');

// Serve static files from "public" directory
app.use(express.static('public'));

// API route
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', staticDir: 'public/' });
});

// Fallback route
app.get('/', (req, res) => {
  res.send(require('fs').readFileSync('index.html', 'utf8'));
});

app.listen(3000, () => console.log('Server started on port 3000'));`,
        takeaways: [
          'express.static() serves entire directories of files automatically',
          'Files are served relative to the static directory path',
          'Use a path prefix to namespace static files under a URL segment',
          'Never put sensitive data in publicly served directories',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-eb-1',
        question: 'Which Express application method is used to route HTTP GET requests to a specified path with a callback function?',
        options: ['app.post()', 'app.request()', 'app.get()', 'app.route()'],
        correct: 2,
      },
      {
        id: 'q-eb-2',
        question: 'What does app.listen(3000) do?',
        options: ['Logs a message to the console', 'Starts the server on port 3000', 'Creates a new route', 'Loads middleware globally'],
        correct: 1,
      },
      {
        id: 'q-eb-3',
        question: 'How do you access a route parameter named :id from a URL like /users/42?',
        options: ['req.query.id', 'req.params.id', 'req.body.id', 'req.id'],
        correct: 1,
      },
      {
        id: 'q-eb-4',
        question: 'What is the purpose of express.Router()?',
        options: ['To handle errors globally', 'To create modular, mountable route groups', 'To parse JSON request bodies', 'To serve static files'],
        correct: 1,
      },
    ],
  },
  // ─── Module 2: Middleware ───
  {
    id: 'middleware',
    title: 'Middleware Magic',
    lessons: [
      {
        id: 'mw-1',
        title: 'Understanding Middleware',
        objectives: [
          'Define what middleware is and how it fits in the request-response cycle',
          'Use the next() function to pass control through the middleware stack',
          'Write a custom logging middleware function',
          'Register middleware globally with app.use()',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">The Middleware Chain</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Middleware functions are functions that have access to the request object (req), the response object (res), and the <strong>next</strong> middleware function in the application's request-response cycle.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">Each middleware can execute any code, modify the req/res objects, end the request-response cycle, or call the next middleware using <code>next()</code>.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Custom logger middleware</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> logger = (req, res, next) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>(req.method + ' ' + req.url);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;next(); <span class="text-gray-500">// Pass to next middleware</span></p>
            <p class="text-gray-700 mb-3">};</p>
            <p class="text-gray-700">app.<span class="text-purple-600">use</span>(logger); <span class="text-gray-500">// Register globally</span></p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">Middleware runs in the order it is registered. If a middleware calls <code>next()</code>, Express moves to the next middleware or route handler. If it sends a response (<code>res.send()</code>, <code>res.json()</code>), the chain stops.</p>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Key Insight:</strong> Middleware is the backbone of Express. Every built-in feature (JSON parsing, static files, CORS) is implemented as middleware under the hood.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();

// Custom Logger Middleware
const loggerMiddleware = (req, res, next) => {
  console.log('[LOG]: ' + req.method + ' request to ' + req.url);
  next();
};

// Register middleware globally
app.use(loggerMiddleware);

// Request timestamp middleware
app.use((req, res, next) => {
  req.requestTime = Date.now();
  next();
});

app.get('/secret', (req, res) => {
  console.log('Requested at: ' + new Date(req.requestTime).toISOString());
  res.send('You found the secret page!');
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'Middleware functions have access to req, res, and next',
          'Call next() to pass control to the next middleware in the chain',
          'Middleware runs in the order it is registered with app.use()',
          'A middleware can end the cycle (send response) or pass to next',
        ],
      },
      {
        id: 'mw-2',
        title: 'Built-in Middleware',
        objectives: [
          'Use express.json() to parse incoming JSON request bodies',
          'Use express.urlencoded() to parse form submissions',
          'Use express.static() to serve static assets',
          'Understand the order and purpose of each built-in middleware',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Express Built-in Middleware</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Express ships with several built-in middleware functions that handle common tasks out of the box.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-3"><span class="text-gray-500">// Parse JSON request bodies (available on req.body)</span></p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">use</span>(express.<span class="text-purple-600">json</span>());</p>
            <p class="text-gray-700 mb-3"><span class="text-gray-500">// Parse URL-encoded form data (from HTML forms)</span></p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">use</span>(express.<span class="text-purple-600">urlencoded</span>({ extended: <span class="text-blue-600">true</span> }));</p>
            <p class="text-gray-700 mb-3"><span class="text-gray-500">// Serve static files from the "public" directory</span></p>
            <p class="text-gray-700">app.<span class="text-purple-600">use</span>(express.<span class="text-purple-600">static</span>(<span class="text-green-600">'public'</span>));</p>
          </div>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><code>express.json()</code> — Parses JSON payloads and puts them on <code>req.body</code></li>
            <li><code>express.urlencoded()</code> — Parses form submissions (like <code>application/x-www-form-urlencoded</code>)</li>
            <li><code>express.static()</code> — Serves static files from a directory</li>
          </ul>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>Important:</strong> Register <code>express.json()</code> and <code>express.urlencoded()</code> before your routes that need to read the request body. Order matters!</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();

// Built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// POST route that uses parsed JSON body
app.post('/api/data', (req, res) => {
  console.log('Received body:', req.body);
  res.json({
    received: true,
    data: req.body,
    contentType: req.get('Content-Type')
  });
});

// POST route for form data
app.post('/api/form', (req, res) => {
  console.log('Form data:', req.body);
  res.json({ formData: req.body });
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'express.json() must be registered before routes that use req.body',
          'express.urlencoded() parses HTML form submissions',
          'express.static() serves entire directories of files automatically',
          'Built-in middleware should be registered early in the chain',
        ],
      },
      {
        id: 'mw-3',
        title: 'Third-Party and Custom Middleware',
        objectives: [
          'Install and use popular third-party middleware like morgan and cors',
          'Create custom middleware for domain-specific logic',
          'Understand when to use third-party vs custom middleware',
          'Chain multiple middleware functions on a single route',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Extending Express with Middleware</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Beyond built-in middleware, the Express ecosystem includes hundreds of third-party middleware packages. The most common ones are morgan (logging), cors (cross-origin requests), and helmet (security headers).</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// HTTP request logger</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> morgan = <span class="text-blue-600">require</span>(<span class="text-green-600">'morgan'</span>);</p>
            <p class="text-gray-700 mb-3">app.<span class="text-purple-600">use</span>(morgan(<span class="text-green-600">'dev'</span>));</p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Cross-Origin Resource Sharing</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> cors = <span class="text-blue-600">require</span>(<span class="text-green-600">'cors'</span>);</p>
            <p class="text-gray-700 mb-3">app.<span class="text-purple-600">use</span>(cors());</p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Security headers</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> helmet = <span class="text-blue-600">require</span>(<span class="text-green-600">'helmet'</span>);</p>
            <p class="text-gray-700">app.<span class="text-purple-600">use</span>(helmet());</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">You can also write <strong>custom middleware</strong> tailored to your app — for example, a rate limiter, an API key checker, or a request timer.</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Pro Tip:</strong> Check npm for middleware before building your own. Packages like morgan and cors are battle-tested by thousands of apps. Only write custom middleware for logic specific to your domain.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();

// Custom middleware: request logger
const requestLogger = (req, res, next) => {
  const start = Date.now();
  console.log('[REQUEST] ' + req.method + ' ' + req.url);
  next();
};

// Custom middleware: response timer
const responseTimer = (req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    console.log('[RESPONSE] ' + req.method + ' ' + req.url + ' - ' + duration + 'ms');
    originalEnd.apply(res, args);
  };
  next();
};

app.use(requestLogger);
app.use(responseTimer);

app.get('/fast', (req, res) => {
  res.send('Quick response');
});

app.get('/slow', (req, res) => {
  setTimeout(() => res.send('Delayed response'), 500);
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'Third-party middleware like morgan, cors, and helmet solve common problems',
          'Custom middleware is ideal for app-specific logic (auth, rate limiting)',
          'Use npm-installed packages before writing your own for standard needs',
          'Middleware can be applied to specific routes or globally',
        ],
      },
      {
        id: 'mw-4',
        title: 'Error-Handling Middleware',
        objectives: [
          'Create error-handling middleware with four parameters',
          'Understand the special signature (err, req, res, next)',
          'Pass errors to Express using next(err)',
          'Build a centralized error-handling strategy',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Catching Errors Gracefully</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Error-handling middleware is defined with <strong>four parameters</strong> instead of three: <code>(err, req, res, next)</code>. Express recognizes it as an error handler by the four-parameter signature.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Error-handling middleware (always 4 params)</span></p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">use</span>((err, req, res, next) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">console</span>.<span class="text-purple-600">error</span>('Error:', err.message);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;res.<span class="text-purple-600">status</span>(err.status || <span class="text-orange-500">500</span>)</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;.<span class="text-purple-600">json</span>({</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;error: err.message || 'Internal Server Error'</p>
            <p class="text-gray-700 mb-3">&nbsp;&nbsp;&nbsp;&nbsp;});</p>
            <p class="text-gray-700 mb-3">});</p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">// Route that triggers an error</span></p>
            <p class="text-gray-700">app.<span class="text-purple-600">get</span>('/broken', (req, res, next) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;next(<span class="text-blue-600">new</span> Error('Something broke!'));</p>
            <p class="text-gray-700">});</p>
          </div>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>Important:</strong> Error-handling middleware must be registered AFTER all your routes. If you register it before routes, Express won't route errors to it!</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();

// Routes
app.get('/ok', (req, res) => {
  res.send('Everything is fine!');
});

app.get('/error', (req, res, next) => {
  next(new Error('Custom error occurred!'));
});

app.get('/async-error', (req, res, next) => {
  try {
    throw new Error('Async handler error');
  } catch (err) {
    next(err);
  }
});

// Error-handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('ERROR CAUGHT:', err.message);
  res.status(500).json({
    error: err.message,
    status: 'error'
  });
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'Error-handling middleware must have exactly 4 parameters',
          'Pass errors to Express using next(err) from any route',
          'Always register error-handling middleware LAST in the chain',
          'Centralized error handling ensures consistent error responses',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-mw-1',
        question: 'If a middleware function does not end the request-response cycle, what MUST it call to pass control to the next middleware function?',
        options: ['continue()', 'res.send()', 'next()', 'return'],
        correct: 2,
      },
      {
        id: 'q-mw-2',
        question: 'How do you register a middleware function globally in Express?',
        options: ['app.middleware(fn)', 'app.use(fn)', 'app.route(fn)', 'app.add(fn)'],
        correct: 1,
      },
      {
        id: 'q-mw-3',
        question: 'How many parameters does error-handling middleware have?',
        options: ['2', '3', '4', '5'],
        correct: 2,
      },
      {
        id: 'q-mw-4',
        question: 'Which built-in middleware parses JSON request bodies and makes them available on req.body?',
        options: ['express.text()', 'express.json()', 'express.bodyParser()', 'express.urlencoded()'],
        correct: 1,
      },
    ],
  },
  // ─── Module 3: Building REST APIs (CRUD) ───
  {
    id: 'rest-crud',
    title: 'Building REST APIs (CRUD)',
    lessons: [
      {
        id: 'crud-1',
        title: 'Creating Resources with POST',
        objectives: [
          'Handle POST requests to create new resources',
          'Parse request bodies using express.json()',
          'Validate incoming data before saving',
          'Return appropriate HTTP status codes (201 Created)',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Creating Resources</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">To handle POST requests (Create), you typically need to parse the incoming request body. Express provides built-in middleware for this: <code>express.json()</code>.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Create a new resource</span></p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">post</span>('/api/items', (req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (!req.body.name) {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">return</span> res.<span class="text-purple-600">status</span>(<span class="text-orange-500">400</span>).<span class="text-purple-600">json</span>({ error: 'Name is required' });</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;}</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">const</span> item = { id: items.length + 1, name: req.body.name };</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;items.push(item);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;res.<span class="text-purple-600">status</span>(<span class="text-orange-500">201</span>).<span class="text-purple-600">json</span>(item);</p>
            <p class="text-gray-700">});</p>
          </div>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-1">
            <li>Always validate input before saving — check required fields and data types</li>
            <li>Use <code>res.status(201)</code> to indicate successful resource creation</li>
            <li>Return the created resource in the response body</li>
          </ul>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>REST Convention:</strong> POST to a collection endpoint like <code>/api/items</code> creates a new item. The server assigns the ID and returns it in the response.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

let items = [];

app.post('/api/items', (req, res) => {
  console.log("Received new item:", req.body);

  if (!req.body.name) {
    return res.status(400).json({ error: "Name is required" });
  }

  const newItem = { id: items.length + 1, name: req.body.name };
  items.push(newItem);

  res.status(201).json(newItem);
});

app.get('/api/items', (req, res) => {
  res.json(items);
});

app.listen(3000, () => console.log('API Server running'));`,
        takeaways: [
          'POST creates new resources on the server',
          'Validate input before saving to prevent bad data',
          'Return 201 Created with the new resource in the body',
          'Use express.json() to parse incoming JSON payloads',
        ],
      },
      {
        id: 'crud-2',
        title: 'Reading Resources with GET',
        objectives: [
          'Fetch a list of resources using GET',
          'Fetch a single resource by ID using route parameters',
          'Handle the case when a resource is not found (404)',
          'Implement basic filtering and pagination',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Reading Data</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">GET requests are used to <strong>read</strong> data. They should never modify server state — they are <strong>safe</strong> and <strong>idempotent</strong> (repeating them doesn't change anything).</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Get all items</span></p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">get</span>('/api/items', (req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;res.<span class="text-purple-600">json</span>(items);</p>
            <p class="text-gray-700 mb-3">});</p>
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Get a single item by ID</span></p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">get</span>('/api/items/:id', (req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">const</span> item = items.<span class="text-purple-600">find</span>(i => i.id === <span class="text-blue-600">parseInt</span>(req.params.id));</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (!item) {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">return</span> res.<span class="text-purple-600">status</span>(<span class="text-orange-500">404</span>).<span class="text-purple-600">json</span>({ error: 'Item not found' });</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;}</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;res.<span class="text-purple-600">json</span>(item);</p>
            <p class="text-gray-700">});</p>
          </div>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>Always handle the "not found" case.</strong> If a client requests a resource that doesn't exist, return 404 with a clear message. Never return an empty 200 OK!</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();

// Sample data
let items = [
  { id: 1, name: 'Learn Express', done: false },
  { id: 2, name: 'Build an API', done: false },
  { id: 3, name: 'Deploy to production', done: true },
];

// Get all items
app.get('/api/items', (req, res) => {
  console.log('Returning ' + items.length + ' items');
  res.json(items);
});

// Get single item
app.get('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const item = items.find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.json(item);
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'GET requests should never modify server state',
          'Use route params to identify specific resources',
          'Always return 404 when a resource is not found',
          'GET is idempotent — calling it multiple times gives the same result',
        ],
      },
      {
        id: 'crud-3',
        title: 'Updating Resources with PUT and PATCH',
        objectives: [
          'Implement PUT for full resource replacement',
          'Implement PATCH for partial updates',
          'Understand the semantic difference between PUT and PATCH',
          'Return appropriate responses for update operations',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Updating Resources</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Express handles two HTTP methods for updates: <strong>PUT</strong> (replace entire resource) and <strong>PATCH</strong> (partial update).</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// PUT: Replace the entire resource</span></p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">put</span>('/api/items/:id', (req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">const</span> item = items.<span class="text-purple-600">find</span>(i => i.id === <span class="text-blue-600">parseInt</span>(req.params.id));</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (!item) <span class="text-blue-600">return</span> res.<span class="text-purple-600">status</span>(<span class="text-orange-500">404</span>).<span class="text-purple-600">json</span>({ error: 'Not found' });</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;item.name = req.body.name;</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;item.done = req.body.done;</p>
            <p class="text-gray-700 mb-3">&nbsp;&nbsp;res.<span class="text-purple-600">json</span>(item);</p>
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// PATCH: Partial update (only provided fields)</span></p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">patch</span>('/api/items/:id', (req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">const</span> item = items.<span class="text-purple-600">find</span>(i => i.id === <span class="text-blue-600">parseInt</span>(req.params.id));</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (!item) <span class="text-blue-600">return</span> res.<span class="text-purple-600">status</span>(<span class="text-orange-500">404</span>).<span class="text-purple-600">json</span>({ error: 'Not found' });</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (req.body.name !== <span class="text-blue-600">undefined</span>) item.name = req.body.name;</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (req.body.done !== <span class="text-blue-600">undefined</span>) item.done = req.body.done;</p>
            <p class="text-gray-700">&nbsp;&nbsp;res.<span class="text-purple-600">json</span>(item);</p>
            <p class="text-gray-700">});</p>
          </div>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Rule of Thumb:</strong> Use PUT when the client sends the complete resource. Use PATCH when the client sends only the fields that changed.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();
app.use(express.json());

let items = [
  { id: 1, name: 'Learn Express', done: false },
  { id: 2, name: 'Build an API', done: false },
];

// PUT: Replace entire resource
app.put('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = items.findIndex(i => i.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  items[index] = { id, name: req.body.name, done: req.body.done };
  res.json(items[index]);
});

// PATCH: Partial update
app.patch('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const item = items.find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  if (req.body.name !== undefined) item.name = req.body.name;
  if (req.body.done !== undefined) item.done = req.body.done;
  res.json(item);
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'PUT replaces the entire resource — all fields must be provided',
          'PATCH updates only the provided fields',
          'Both should validate that the resource exists first',
          'PUT is idempotent (same request multiple times = same result)',
        ],
      },
      {
        id: 'crud-4',
        title: 'Deleting Resources with DELETE',
        objectives: [
          'Implement DELETE endpoints to remove resources',
          'Understand soft delete vs hard delete patterns',
          'Return proper status codes for deletion (200, 204, 404)',
          'Prevent accidental data loss with confirmation patterns',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Deleting Resources</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">DELETE requests remove resources from the server. They are <strong>not idempotent</strong> in the strict sense — after the first delete, subsequent requests to the same endpoint should return 404.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Delete a resource</span></p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">delete</span>('/api/items/:id', (req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">const</span> index = items.<span class="text-purple-600">findIndex</span>(i => i.id === <span class="text-blue-600">parseInt</span>(req.params.id));</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (index === -<span class="text-orange-500">1</span>) {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">return</span> res.<span class="text-purple-600">status</span>(<span class="text-orange-500">404</span>).<span class="text-purple-600">json</span>({ error: 'Item not found' });</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;}</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">const</span> deleted = items.<span class="text-purple-600">splice</span>(index, <span class="text-orange-500">1</span>)[<span class="text-orange-500">0</span>];</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;res.<span class="text-purple-600">json</span>({ message: 'Item deleted', item: deleted });</p>
            <p class="text-gray-700">});</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">Two deletion patterns exist: <strong>Hard delete</strong> (permanently removes data — simple but irreversible) and <strong>Soft delete</strong> (marks record as deleted but keeps it — safer and allows recovery).</p>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>Security Note:</strong> Always authenticate and authorize DELETE requests. Never expose DELETE on public endpoints without auth checks.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();
app.use(express.json());

let items = [
  { id: 1, name: 'Learn Express', done: false },
  { id: 2, name: 'Temporary data', done: false },
  { id: 3, name: 'Old record', done: true },
];

// DELETE endpoint
app.delete('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = items.findIndex(i => i.id === id);

  if (index === -1) {
    console.log('Delete failed: item ' + id + ' not found');
    return res.status(404).json({ error: 'Item not found' });
  }

  const deleted = items.splice(index, 1)[0];
  console.log('Deleted item: ' + deleted.name);
  res.json({ message: 'Item deleted', item: deleted });
});

app.get('/api/items', (req, res) => {
  res.json(items);
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'DELETE removes resources identified by their ID',
          'Return 404 if the resource does not exist',
          'Soft delete is safer than hard delete for production data',
          'Always authenticate and authorize DELETE requests',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-crud-1',
        question: 'What HTTP status code is typically returned for a successful POST request that creates a resource?',
        options: ['200 OK', '201 Created', '204 No Content', '301 Moved'],
        correct: 1,
      },
      {
        id: 'q-crud-2',
        question: 'Which HTTP method is both safe (does not change state) and idempotent?',
        options: ['POST', 'GET', 'DELETE', 'PATCH'],
        correct: 1,
      },
      {
        id: 'q-crud-3',
        question: 'What is the difference between PUT and PATCH?',
        options: ['PUT replaces the entire resource; PATCH does a partial update', 'PUT is for text; PATCH is for JSON', 'There is no difference', 'PATCH is faster than PUT'],
        correct: 0,
      },
      {
        id: 'q-crud-4',
        question: 'What should a DELETE endpoint return if the resource does not exist?',
        options: ['200 OK', '204 No Content', '404 Not Found', '500 Internal Server Error'],
        correct: 2,
      },
    ],
  },
  // ─── Module 4: Request Validation ───
  {
    id: 'request-validation',
    title: 'Request Validation',
    lessons: [
      {
        id: 'rv-1',
        title: 'Why Validate Input?',
        objectives: [
          'Understand the security risks of unvalidated user input',
          'Identify common injection attack vectors',
          'Recognize the principle of "never trust user input"',
          'Distinguish between validation and sanitization',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Never Trust User Input</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Unvalidated user input is the #1 cause of security vulnerabilities in web applications. Without validation, users can send malformed, malicious, or unexpected data that crashes your app or exposes sensitive data.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// WITHOUT validation - DANGEROUS!</span></p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">post</span>('/api/comment', (req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;save(req.body.text); <span class="text-gray-500">// Could save malicious script!</span></p>
            <p class="text-gray-700 mb-3">});</p>
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// WITH validation - SAFE</span></p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">post</span>('/api/comment', (req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (<span class="text-blue-600">typeof</span> req.body.text !== 'string' || req.body.text.length > <span class="text-orange-500">500</span>) {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">return</span> res.<span class="text-purple-600">status</span>(<span class="text-orange-500">400</span>).<span class="text-purple-600">json</span>({ error: 'Invalid text' });</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;}</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;save(req.body.text); <span class="text-gray-500">// Clean data</span></p>
            <p class="text-gray-700">});</p>
          </div>
          <div class="bg-red-50 border-l-4 border-red-500 p-4 my-6 rounded-r-lg">
            <p class="text-red-800"><strong>Golden Rule:</strong> Treat all user input as guilty until proven innocent. Validate every field — type, length, format, range — before using it in your application logic.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();
app.use(express.json());

// Unsafe endpoint (no validation)
app.post('/api/unsafe', (req, res) => {
  console.log('Saving:', req.body);
  res.json({ saved: req.body });
});

// Safe endpoint (with validation)
app.post('/api/safe', (req, res) => {
  const { name, age, email } = req.body;

  // Manual validation
  if (!name || typeof name !== 'string' || name.length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters' });
  }
  if (!age || typeof age !== 'number' || age < 0 || age > 150) {
    return res.status(400).json({ error: 'Age must be between 0 and 150' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  res.json({ message: 'Validated!', data: { name, age, email } });
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'Never trust user input — always validate before processing',
          'Unvalidated input leads to security vulnerabilities (XSS, injection)',
          'Check type, length, format, and range of every field',
          'Validation should happen as early as possible in the request cycle',
        ],
      },
      {
        id: 'rv-2',
        title: 'Manual Validation in Express',
        objectives: [
          'Write manual validation checks for common data types',
          'Build reusable validation middleware functions',
          'Return descriptive error messages per field',
          'Handle multiple validation errors at once',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Validating by Hand</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Before reaching for validation libraries, it is valuable to understand how manual validation works. For simple endpoints, a few <code>if</code> statements may be all you need.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Reusable validation middleware</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> validateUser = (req, res, next) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">const</span> errors = [];</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (!req.body.name) errors.push('Name is required');</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (req.body.email && !req.body.email.<span class="text-purple-600">includes</span>('@'))</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;errors.push('Invalid email');</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (errors.length) {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">return</span> res.<span class="text-purple-600">status</span>(<span class="text-orange-500">400</span>).<span class="text-purple-600">json</span>({ errors });</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;}</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;next();</p>
            <p class="text-gray-700">};</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">By collecting all errors before responding, you give the client a complete picture of what needs to be fixed — instead of making them fix one field at a time.</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Pro Tip:</strong> Extract validation logic into middleware functions. This keeps route handlers clean and validation reusable across multiple endpoints.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();
app.use(express.json());

// Reusable validation middleware
function validateCreateItem(req, res, next) {
  const errors = [];

  if (!req.body.name || typeof req.body.name !== 'string') {
    errors.push('Name is required and must be a string');
  }
  if (req.body.price !== undefined && typeof req.body.price !== 'number') {
    errors.push('Price must be a number');
  }
  if (req.body.quantity !== undefined && req.body.quantity < 0) {
    errors.push('Quantity cannot be negative');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  next();
}

app.post('/api/items', validateCreateItem, (req, res) => {
  console.log('Validated data:', req.body);
  res.status(201).json({
    message: 'Item created',
    item: { id: Date.now(), ...req.body }
  });
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'Manual validation uses if-statements to check each field',
          'Collect all errors before responding for a better UX',
          'Extract validation into reusable middleware functions',
          'Manual validation works well for simple endpoints',
        ],
      },
      {
        id: 'rv-3',
        title: 'Validation with express-validator',
        objectives: [
          'Install and configure express-validator',
          'Use body(), param(), and query() validation chains',
          'Handle validation errors with validationResult()',
          'Create custom validators for domain-specific rules',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Declarative Validation</h3>
          <p class="mb-4 text-gray-700 leading-relaxed"><code>express-validator</code> is a popular library that provides a clean, declarative way to validate request data. It uses a chainable API to define validation rules.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">const</span> { body, validationResult } = <span class="text-blue-600">require</span>('express-validator');</p>
            <p class="text-gray-700 mb-3">&nbsp;</p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">post</span>('/api/users', [</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;body('name').<span class="text-purple-600">trim</span>().<span class="text-purple-600">notEmpty</span>().<span class="text-purple-600">withMessage</span>('Name is required'),</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;body('email').<span class="text-purple-600">isEmail</span>().<span class="text-purple-600">withMessage</span>('Valid email required'),</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;body('age').<span class="text-purple-600">isInt</span>({ min: <span class="text-orange-500">0</span>, max: <span class="text-orange-500">120</span> }),</p>
            <p class="text-gray-700 mb-3">], (req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">const</span> errors = validationResult(req);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (!errors.<span class="text-purple-600">isEmpty</span>()) {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">return</span> res.<span class="text-purple-600">status</span>(<span class="text-orange-500">400</span>).<span class="text-purple-600">json</span>({ errors: errors.<span class="text-purple-600">array</span>() });</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;}</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-gray-500">// Process validated data...</span></p>
            <p class="text-gray-700">});</p>
          </div>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Why express-validator?</strong> It reduces boilerplate, provides 150+ built-in validators, handles nested objects, and integrates cleanly with Express middleware patterns.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();
app.use(express.json());

// Simulated express-validator style
app.post('/api/users', (req, res) => {
  const { name, email, age } = req.body;
  const errors = [];

  if (!name || name.trim().length === 0) errors.push({ msg: 'Name is required' });
  if (!email || !email.includes('@') || !email.includes('.')) errors.push({ msg: 'Valid email required' });
  if (!Number.isInteger(age) || age < 0 || age > 120) errors.push({ msg: 'Age must be an integer (0-120)' });

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  res.json({ message: 'User validated', user: { name, email, age } });
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'express-validator provides a clean chainable API for validation',
          'Use body(), param(), and query() to target specific request properties',
          'Extract errors with validationResult() and return them as a response',
          'Custom validators can handle domain-specific business rules',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-rv-1',
        question: 'Why is validating user input important?',
        options: ['To make the code run faster', 'To prevent malicious data and ensure data integrity', 'To reduce the number of routes needed', 'It is optional and only for security'],
        correct: 1,
      },
      {
        id: 'q-rv-2',
        question: 'What does the trim() sanitizer do?',
        options: ['Removes HTML tags from input', 'Removes whitespace from the start and end of strings', 'Converts input to lowercase', 'Validates that input is not empty'],
        correct: 1,
      },
      {
        id: 'q-rv-3',
        question: 'Which express-validator function checks if a field contains a valid email address?',
        options: ['body("email").isValid()', 'body("email").isEmail()', 'body("email").checkEmail()', 'body("email").email()'],
        correct: 1,
      },
    ],
  },
  // ─── Module 5: Error Handling ───
  {
    id: 'error-handling',
    title: 'Error Handling',
    lessons: [
      {
        id: 'eh-1',
        title: 'Error Handling Fundamentals',
        objectives: [
          'Understand synchronous vs asynchronous error handling in Express',
          'Use try/catch blocks to handle thrown errors',
          'Pass errors to Express error handlers using next(err)',
          'Distinguish between operational and programmer errors',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Handling Errors in Express</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Express makes a distinction between synchronous errors (thrown in route handlers) and asynchronous errors (from promises, callbacks, or async/await).</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Synchronous error - Express catches this automatically</span></p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">get</span>('/sync-error', (req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">throw new</span> Error('Oops!');</p>
            <p class="text-gray-700 mb-3">});</p>
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Asynchronous error - MUST use next(err)</span></p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">get</span>('/async-error', <span class="text-blue-600">async</span> (req, res, next) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">try</span> {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">await</span> someAsyncFunction();</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;} <span class="text-blue-600">catch</span> (err) {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;next(err); <span class="text-gray-500">// Pass to Express error handler</span></p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;}</p>
            <p class="text-gray-700">});</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Operational errors</strong> are expected — invalid input, database timeout, file not found. Handle them gracefully. <strong>Programmer errors</strong> are bugs — reference errors, type errors. Fix them in development.</p>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>Remember:</strong> Always wrap async route handlers in try/catch and call <code>next(err)</code> in the catch block. Otherwise Express will not catch the error and the request will hang!</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();

// Sync error (Express catches automatically)
app.get('/sync-throw', (req, res) => {
  throw new Error('Synchronous error!');
});

// Async error (must use next())
app.get('/async-catch', async (req, res, next) => {
  try {
    throw new Error('Async operation failed');
  } catch (err) {
    next(err);
  }
});

// Wrapper to catch async errors automatically
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

app.get('/wrapped', asyncHandler(async (req, res) => {
  throw new Error('Caught by asyncHandler wrapper!');
}));

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'Synchronous errors are caught automatically by Express',
          'Async errors require try/catch with next(err)',
          'Use an asyncHandler wrapper to avoid repetitive try/catch blocks',
          'Always propagate errors to a centralized handler',
        ],
      },
      {
        id: 'eh-2',
        title: 'Custom Error Classes',
        objectives: [
          'Create custom error classes that extend the built-in Error',
          'Add statusCode and metadata properties to errors',
          'Use custom errors to provide structured error information',
          'Differentiate error types for better error handling',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Better Errors with Custom Classes</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Extending the built-in <code>Error</code> class lets you create domain-specific errors with additional properties like HTTP status codes, error codes, and metadata.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">class</span> NotFoundError <span class="text-blue-600">extends</span> Error {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">constructor</span>(resource = 'Resource') {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">super</span>(resource + ' not found');</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">this</span>.name = 'NotFoundError';</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">this</span>.statusCode = <span class="text-orange-500">404</span>;</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;}</p>
            <p class="text-gray-700 mb-3">}</p>
            <p class="text-gray-700 mb-2"><span class="text-blue-600">class</span> ValidationError <span class="text-blue-600">extends</span> Error {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">constructor</span>(errors) {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">super</span>('Validation failed');</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">this</span>.name = 'ValidationError';</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">this</span>.statusCode = <span class="text-orange-500">400</span>;</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">this</span>.errors = errors;</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;}</p>
            <p class="text-gray-700">}</p>
          </div>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Why custom errors?</strong> They make error handling predictable. Your error handler can check <code>err.name</code> or <code>err.statusCode</code> to decide the response format, without parsing error messages as strings.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();
app.use(express.json());

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super((resource || 'Resource') + ' not found', 404);
    this.name = 'NotFoundError';
  }
}

// Routes using custom errors
const users = [{ id: 1, name: 'Alice' }];

app.get('/api/users/:id', (req, res, next) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    throw new NotFoundError('User');
  }
  res.json(user);
});

// Error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ error: err.message });
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'Custom error classes extend the built-in Error class',
          'Add statusCode and metadata properties for structured error info',
          'Custom errors make your error handler simpler and more predictable',
          'Use different error classes for different error types (404, 400, 401)',
        ],
      },
      {
        id: 'eh-3',
        title: 'Async Error Handling',
        objectives: [
          'Understand why Express does not catch async errors automatically',
          'Build a reusable asyncHandler wrapper function',
          'Handle Promise rejections in route handlers',
          'Prevent unhandled Promise rejections from crashing the app',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Taming Async Errors</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Express 4.x does <strong>not</strong> catch errors thrown inside async functions. If an async handler throws, Express won't know about it — the request hangs until it times out.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// The asyncHandler wrapper pattern</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> asyncHandler = (fn) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">return</span> (req, res, next) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">return</span> <span class="text-blue-600">Promise</span>.<span class="text-purple-600">resolve</span>(fn(req, res, next)).<span class="text-purple-600">catch</span>(next);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;};</p>
            <p class="text-gray-700 mb-3">};</p>
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Usage - no try/catch needed!</span></p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">get</span>('/data', asyncHandler(<span class="text-blue-600">async</span> (req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">const</span> data = <span class="text-blue-600">await</span> fetchFromDatabase();</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;res.<span class="text-purple-600">json</span>(data);</p>
            <p class="text-gray-700">}));</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>asyncHandler</code> wrapper catches any rejected promise and passes it to <code>next()</code>, which forwards it to Express's error-handling middleware.</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Express 5 Note:</strong> Express 5.x (still in beta) will automatically catch async errors. But for Express 4.x (the current stable version), always use asyncHandler or try/catch with next().</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();

// The asyncHandler wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Simulated async database call
function findUserById(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id === '0') reject(new Error('Database connection failed'));
      else resolve({ id, name: 'Alice' });
    }, 100);
  });
}

// Clean async route - no try/catch with asyncHandler
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await findUserById(req.params.id);
  res.json(user);
}));

// Error handler
app.use((err, req, res, next) => {
  console.error('Async error caught:', err.message);
  res.status(500).json({ error: err.message });
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'Express 4.x does not catch async errors automatically',
          'Use an asyncHandler wrapper to catch rejected promises',
          'The wrapper pattern eliminates repetitive try/catch blocks',
          'Express 5.x will handle async errors natively',
        ],
      },
      {
        id: 'eh-4',
        title: 'Centralized Error Handler',
        objectives: [
          'Build a single error-handling middleware for the entire app',
          'Differentiate between operational and programmer errors in the handler',
          'Log errors for debugging and monitoring',
          'Return consistent JSON error responses to clients',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">One Handler to Rule Them All</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">A centralized error handler sits at the end of your middleware stack and catches every error from every route. It provides a single place to log, format, and respond to errors consistently.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Centralized error handler (last middleware)</span></p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">use</span>((err, req, res, next) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-gray-500">// Log the error (for developers)</span></p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">console</span>.<span class="text-purple-600">error</span>(err.name + ': ' + err.message);</p>
            <p class="text-gray-700 mb-3">&nbsp;</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-gray-500">// Determine status code</span></p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">const</span> statusCode = err.statusCode || <span class="text-orange-500">500</span>;</p>
            <p class="text-gray-700 mb-3">&nbsp;</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-gray-500">// Send consistent response</span></p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;res.<span class="text-purple-600">status</span>(statusCode).<span class="text-purple-600">json</span>({</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;status: 'error',</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;message: err.message || 'Internal server error'</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;});</p>
            <p class="text-gray-700">});</p>
          </div>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Best Practice:</strong> Never leak stack traces in production. They expose file structure and line numbers to potential attackers.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();
app.use(express.json());

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Routes that produce different errors
app.get('/not-found', (req, res, next) => {
  next(new AppError('User not found', 404));
});

app.get('/bad-request', (req, res, next) => {
  next(new AppError('Invalid input data', 400));
});

app.get('/server-error', (req, res, next) => {
  next(new AppError('Database timeout', 503));
});

app.get('/ok', (req, res) => {
  res.json({ message: 'All good' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error('[' + statusCode + '] ' + err.message);
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: err.isOperational ? err.message : 'Internal server error'
  });
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'Centralized error handler must be registered LAST',
          'Log every error for debugging and monitoring',
          'Return consistent JSON error format to clients',
          'Hide stack traces in production for security',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-eh-1',
        question: 'How many parameters does error-handling middleware have?',
        options: ['2', '3', '4', '5'],
        correct: 2,
      },
      {
        id: 'q-eh-2',
        question: 'How do you pass an error from an async route handler to Express?',
        options: ['throw error', 'return error', 'next(error)', 'err()'],
        correct: 2,
      },
      {
        id: 'q-eh-3',
        question: 'What is the main benefit of a centralized error handler?',
        options: ['Faster response times', 'Consistent error format across all endpoints', 'Less code is needed overall', 'Simplifies route definitions'],
        correct: 1,
      },
      {
        id: 'q-eh-4',
        question: 'What property should custom error classes include for proper HTTP responses?',
        options: ['errorCode', 'statusCode', 'httpCode', 'responseCode'],
        correct: 1,
      },
    ],
  },
  // ─── Module 6: Authentication & Auth ───
  {
    id: 'authentication',
    title: 'Authentication & Auth',
    lessons: [
      {
        id: 'aa-1',
        title: 'Authentication vs Authorization',
        objectives: [
          'Understand the difference between authentication and authorization',
          'Implement a basic login endpoint with credential verification',
          'Use req.headers for reading authorization credentials',
          'Understand common authentication strategies (session, JWT, OAuth)',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Who You Are vs What You Can Do</h3>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Authentication</strong> is the process of verifying who a user is (e.g., checking username/password). <strong>Authorization</strong> determines what an authenticated user is allowed to do.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Basic authentication endpoint</span></p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">post</span>('/api/login', (req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">const</span> { username, password } = req.body;</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (username === 'admin' && password === 'secret') {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;res.<span class="text-purple-600">json</span>({ token: 'fake-jwt-token', role: 'admin' });</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;} <span class="text-blue-600">else</span> {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;res.<span class="text-purple-600">status</span>(<span class="text-orange-500">401</span>).<span class="text-purple-600">json</span>({ error: 'Invalid credentials' });</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;}</p>
            <p class="text-gray-700">});</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">The three common authentication strategies in Express are: <strong>Session-based</strong> (server stores session, client gets a cookie), <strong>JWT</strong> (self-contained token sent via Authorization header), and <strong>OAuth</strong> (delegated auth via Google, GitHub, etc.).</p>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Key Insight:</strong> Authentication happens once (login), authorization happens on every request.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();
app.use(express.json());

// Mock user database
const users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
  { id: 2, username: 'user', password: 'user123', role: 'user' },
];

// Login endpoint (authentication)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  console.log('User ' + user.username + ' logged in');
  res.json({
    message: 'Login successful',
    token: 'token-' + user.id,
    user: { id: user.id, username: user.username, role: user.role }
  });
});

// Profile endpoint (requires auth token)
app.get('/api/profile', (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  res.json({ message: 'Profile data', token });
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'Authentication = verifying identity; Authorization = verifying permissions',
          'POST /api/login is the standard auth endpoint pattern',
          'Use the Authorization header to send credentials on subsequent requests',
          '401 Unauthorized for failed auth, 403 Forbidden for failed authorization',
        ],
      },
      {
        id: 'aa-2',
        title: 'JWT Authentication',
        objectives: [
          'Understand the structure of a JWT (header, payload, signature)',
          'Create and sign JWTs using a secret key',
          'Verify and decode JWTs on protected routes',
          'Store JWT expiry and user claims in the token payload',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">JSON Web Tokens</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">A JWT (JSON Web Token) is a self-contained token format consisting of three base64-encoded parts separated by dots: <code>header.payload.signature</code>. The signature ensures the token has not been tampered with.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// JWT structure</span></p>
            <p class="text-gray-700 mb-1"><span class="text-gray-500">// header: { "alg": "HS256", "typ": "JWT" }</span></p>
            <p class="text-gray-700 mb-1"><span class="text-gray-500">// payload: { "userId": 1, "role": "admin", "exp": 1700000000 }</span></p>
            <p class="text-gray-700 mb-3"><span class="text-gray-500">// signature: HMACSHA256(base64(header) + "." + base64(payload), secret)</span></p>
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Creating a token</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> token = jwt.<span class="text-purple-600">sign</span>(</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;{ userId: <span class="text-orange-500">1</span>, role: 'admin' },</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;'my-secret-key',</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;{ expiresIn: '1h' }</p>
            <p class="text-gray-700">);</p>
          </div>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>Important:</strong> JWTs are <em>signed, not encrypted</em>. Anyone can decode and read the payload (base64 is reversible). Never store sensitive information (passwords, credit card numbers) in a JWT payload.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();
app.use(express.json());

const SECRET = 'express-academy-secret';
const users = [
  { id: 1, username: 'alice', password: 'pass123', role: 'user' },
  { id: 2, username: 'bob', password: 'pass456', role: 'admin' },
];

function base64encode(str) { return Buffer.from(str).toString('base64'); }
function base64decode(str) { return Buffer.from(str, 'base64').toString(); }

function createToken(payload) {
  const header = base64encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64encode(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 3600000 }));
  const signature = base64encode(SECRET + '.' + body);
  return header + '.' + body + '.' + signature;
}

function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(base64decode(parts[1]));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch (e) { return null; }
}

// Login - returns a JWT
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = createToken({ userId: user.id, role: user.role, username: user.username });
  console.log('Token issued for ' + user.username);
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// Protected route
app.get('/api/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  const payload = verifyToken(auth.replace('Bearer ', ''));
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
  res.json({ user: payload });
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'JWT consists of header.payload.signature — three base64-encoded parts',
          'Sign tokens with a secret that only the server knows',
          'Include expiry (exp) in the payload to limit token lifetime',
          'Never put secrets or sensitive data in the JWT payload',
        ],
      },
      {
        id: 'aa-3',
        title: 'Protecting Routes with Middleware',
        objectives: [
          'Build an auth middleware that verifies JWT tokens',
          'Attach the authenticated user to the request object',
          'Apply auth middleware to specific routes',
          'Return 401 for missing/invalid tokens and 403 for insufficient permissions',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Auth Middleware</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The most common pattern for protecting routes in Express is to create an authentication middleware that runs before the route handler. This keeps auth logic centralized and reusable.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Auth middleware</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> authenticate = (req, res, next) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">const</span> token = req.headers.<span class="text-purple-600">authorization</span>?.<span class="text-purple-600">replace</span>('Bearer ', '');</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">if</span> (!token) {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">return</span> res.<span class="text-purple-600">status</span>(<span class="text-orange-500">401</span>).<span class="text-purple-600">json</span>({ error: 'Authentication required' });</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;}</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;req.user = decoded; <span class="text-gray-500">// Attach to request</span></p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;next();</p>
            <p class="text-gray-700">};</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">Apply auth middleware to specific routes by passing it as a second argument: <code>app.get('/api/profile', authenticate, handler)</code>. The middleware runs before the handler.</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Pro Pattern:</strong> Attach the decoded user to <code>req.user</code> in the middleware. Every downstream route and middleware can then access <code>req.user.id</code>, <code>req.user.role</code>, etc. without re-decoding the token.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();
app.use(express.json());

const SECRET = 'secret-key';
const users = [
  { id: 1, username: 'alice', role: 'user' },
  { id: 2, username: 'bob', role: 'admin' },
];

function createToken(user) {
  const payload = JSON.stringify({ userId: user.id, role: user.role });
  return Buffer.from(payload).toString('base64') + '.' + SECRET;
}

function decodeToken(token) {
  try {
    const parts = token.split('.');
    return JSON.parse(Buffer.from(parts[0], 'base64').toString());
  } catch (e) { return null; }
}

// Auth middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }
  const decoded = decodeToken(authHeader.replace('Bearer ', ''));
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  req.user = decoded;
  next();
}

// Public route
app.get('/api/public', (req, res) => {
  res.json({ message: 'This is public' });
});

// Protected route
app.get('/api/profile', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Login
app.post('/api/login', (req, res) => {
  const user = users.find(u => u.username === req.body.username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = createToken(user);
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'Auth middleware checks tokens before route handlers execute',
          'Attach decoded user data to req.user for downstream access',
          'Apply auth middleware as a route-specific argument',
          'Return 401 for invalid tokens, 403 for insufficient permissions',
        ],
      },
      {
        id: 'aa-4',
        title: 'Role-Based Access Control',
        objectives: [
          'Implement role-based authorization middleware',
          'Restrict certain endpoints to specific user roles',
          'Create reusable authorize() middleware for different permission levels',
          'Combine auth + role middleware for granular access control',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Who Can Do What</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Role-Based Access Control (RBAC) restricts access to resources based on a user's role. Common roles include <code>user</code>, <code>moderator</code>, and <code>admin</code>, each with different permission levels.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Role-checking middleware factory</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> <span class="text-purple-600">authorize</span> = (...allowedRoles) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">return</span> (req, res, next) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">if</span> (!req.user) {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">return</span> res.<span class="text-purple-600">status</span>(<span class="text-orange-500">401</span>).<span class="text-purple-600">json</span>({ error: 'Not authenticated' });</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;}</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">if</span> (!allowedRoles.<span class="text-purple-600">includes</span>(req.user.role)) {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">return</span> res.<span class="text-purple-600">status</span>(<span class="text-orange-500">403</span>).<span class="text-purple-600">json</span>({ error: 'Insufficient permissions' });</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;}</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;next();</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;};</p>
            <p class="text-gray-700">};</p>
          </div>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Usage:</strong> <code>app.delete('/api/users/:id', authenticate, authorize('admin'), handler)</code> — the user must be both authenticated AND an admin. Middleware runs left to right.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();
app.use(express.json());

const SECRET = 'rbac-secret';
const users = [
  { id: 1, username: 'alice', role: 'user' },
  { id: 2, username: 'bob', role: 'moderator' },
  { id: 3, username: 'charlie', role: 'admin' },
];

function createToken(user) {
  return Buffer.from(JSON.stringify({ userId: user.id, role: user.role })).toString('base64') + '.' + SECRET;
}
function decodeToken(token) {
  try { return JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString()); }
  catch (e) { return null; }
}

// Auth middleware
function authenticate(req, res, next) {
  const decoded = decodeToken((req.headers.authorization || '').replace('Bearer ', ''));
  if (!decoded) return res.status(401).json({ error: 'Not authenticated' });
  req.user = decoded;
  next();
}

// Role-based authorization middleware
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Routes with different access levels
app.get('/api/public', (req, res) => res.json({ message: 'Public' }));
app.get('/api/user', authenticate, (req, res) => res.json({ message: 'Authenticated', user: req.user }));
app.get('/api/moderator', authenticate, authorize('moderator', 'admin'), (req, res) => res.json({ message: 'Moderator+', user: req.user }));
app.delete('/api/admin', authenticate, authorize('admin'), (req, res) => res.json({ message: 'Admin only' }));

app.post('/api/login', (req, res) => {
  const user = users.find(u => u.username === req.body.username);
  if (!user) return res.status(401).json({ error: 'Invalid' });
  res.json({ token: createToken(user), role: user.role });
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'RBAC restricts access based on user roles stored in the token',
          'Create an authorize() middleware factory that accepts allowed roles',
          'Chain authenticate + authorize for two-layer security',
          'Return 403 Forbidden (not 401) when authenticated but not authorized',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-aa-1',
        question: 'What is the difference between authentication and authorization?',
        options: ['Authentication checks identity; authorization checks permissions', 'Authorization checks identity; authentication checks permissions', 'They mean the same thing', 'Authentication is for users; authorization is for admins'],
        correct: 0,
      },
      {
        id: 'q-aa-2',
        question: 'What does JWT stand for?',
        options: ['JavaScript Web Token', 'JSON Web Token', 'Java Web Toolkit', 'JSON with Text'],
        correct: 1,
      },
      {
        id: 'q-aa-3',
        question: 'Where is a JWT typically sent by the client in each request?',
        options: ['URL query string', 'Request body', 'Authorization header', 'Cookie (always)'],
        correct: 2,
      },
      {
        id: 'q-aa-4',
        question: 'What HTTP status code indicates the client is not authenticated?',
        options: ['400 Bad Request', '401 Unauthorized', '403 Forbidden', '404 Not Found'],
        correct: 1,
      },
    ],
  },
  // ─── Module 7: Database Integration ───
  {
    id: 'database-integration',
    title: 'Database Integration',
    lessons: [
      {
        id: 'di-1',
        title: 'Connecting to MongoDB with Mongoose',
        objectives: [
          'Install and configure Mongoose in an Express project',
          'Connect to a MongoDB database using mongoose.connect()',
          'Handle connection events (connected, error, disconnected)',
          'Understand Mongoose schema basics',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Express Meets MongoDB</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Mongoose is an ODM (Object Document Mapper) for MongoDB and Node.js. It provides a schema-based solution to model your application data and includes built-in validation, query building, and middleware.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">const</span> mongoose = <span class="text-blue-600">require</span>('mongoose');</p>
            <p class="text-gray-700 mb-3">&nbsp;</p>
            <p class="text-gray-700 mb-1"><span class="text-gray-500">// Connect to MongoDB</span></p>
            <p class="text-gray-700 mb-1">mongoose.<span class="text-purple-600">connect</span>('mongodb://localhost:27017/myapp')</p>
            <p class="text-gray-700 mb-3">&nbsp;&nbsp;.then(() => <span class="text-blue-600">console</span>.<span class="text-purple-600">log</span>('Connected to MongoDB'))</p>
            <p class="text-gray-700 mb-3">&nbsp;&nbsp;.catch(err => <span class="text-blue-600">console</span>.<span class="text-purple-600">error</span>('Connection error:', err));</p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Define a schema</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> userSchema = <span class="text-blue-600">new</span> mongoose.<span class="text-purple-600">Schema</span>({</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;name: String, email: String, age: Number</p>
            <p class="text-gray-700 mb-1">});</p>
            <p class="text-gray-700 mb-3">&nbsp;</p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> User = mongoose.<span class="text-purple-600">model</span>('User', userSchema);</p>
          </div>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>Best Practice:</strong> Store your MongoDB connection string in an environment variable (<code>process.env.MONGODB_URI</code>), not hard-coded in your source code.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();

// Simulated Mongoose
const mongoose = {
  _connected: false,
  connect(uri) {
    console.log('Connecting to ' + uri + '...');
    return new Promise((resolve) => {
      setTimeout(() => {
        this._connected = true;
        console.log('Mongoose connected successfully');
        resolve();
      }, 500);
    });
  },
  Schema: function(fields) { this.fields = fields; },
  model(name, schema) {
    console.log('Model "' + name + '" registered');
    return { name, schema };
  }
};

mongoose.connect('mongodb://localhost:27017/myapp')
  .then(() => console.log('Database connection established'))
  .catch(err => console.error('Connection failed:', err.message));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  age: Number
});

const User = mongoose.model('User', userSchema);

app.get('/api/status', (req, res) => {
  res.json({ connected: mongoose._connected, model: User.name });
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'Mongoose provides schema-based modeling for MongoDB',
          'Use mongoose.connect() with the MongoDB connection URI',
          'Listen to connection events for monitoring database health',
          'Store connection strings in environment variables, not code',
        ],
      },
      {
        id: 'di-2',
        title: 'CRUD with Mongoose Models',
        objectives: [
          'Perform Create, Read, Update, and Delete operations via Mongoose models',
          'Use async/await with Mongoose queries',
          'Handle database errors in route handlers',
          'Use query methods like find(), findById(), create(), findByIdAndUpdate()',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Database CRUD Operations</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Mongoose models provide a rich set of methods for interacting with MongoDB. All CRUD operations return Promises, so use async/await in your route handlers.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// CREATE</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> user = <span class="text-blue-600">await</span> User.<span class="text-purple-600">create</span>({ name: 'Alice', email: 'alice@test.com' });</p>
            <p class="text-gray-700 mb-3">&nbsp;</p>
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// READ (all)</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> users = <span class="text-blue-600">await</span> User.<span class="text-purple-600">find</span>();</p>
            <p class="text-gray-700 mb-3">&nbsp;</p>
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// READ (one)</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> user = <span class="text-blue-600">await</span> User.<span class="text-purple-600">findById</span>(id);</p>
            <p class="text-gray-700 mb-3">&nbsp;</p>
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// UPDATE</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> updated = <span class="text-blue-600">await</span> User.<span class="text-purple-600">findByIdAndUpdate</span>(id, { name: 'Bob' }, { new: <span class="text-blue-600">true</span> });</p>
            <p class="text-gray-700 mb-3">&nbsp;</p>
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// DELETE</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> deleted = <span class="text-blue-600">await</span> User.<span class="text-purple-600">findByIdAndDelete</span>(id);</p>
          </div>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Note:</strong> <code>{ new: true }</code> in findByIdAndUpdate tells Mongoose to return the updated document. Without it, Mongoose returns the original document by default.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();
app.use(express.json());

// Simulated Mongoose model
const User = {
  data: [
    { _id: '1', name: 'Alice', email: 'alice@test.com', age: 30 },
    { _id: '2', name: 'Bob', email: 'bob@test.com', age: 25 },
  ],
  async find() { return this.data; },
  async findById(id) { return this.data.find(u => u._id === id) || null; },
  async create(doc) { const n = { _id: String(this.data.length + 1), ...doc }; this.data.push(n); return n; },
  async findByIdAndUpdate(id, update, opts) {
    const idx = this.data.findIndex(u => u._id === id);
    if (idx === -1) return null;
    if (opts && opts.new !== false) Object.assign(this.data[idx], update, { _id: id });
    return this.data[idx];
  },
  async findByIdAndDelete(id) {
    const idx = this.data.findIndex(u => u._id === id);
    if (idx === -1) return null;
    return this.data.splice(idx, 1)[0];
  }
};

// Routes
app.get('/api/users', async (req, res) => { res.json(await User.find()); });
app.get('/api/users/:id', async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found' });
  res.json(u);
});
app.post('/api/users', async (req, res) => {
  try { res.status(201).json(await User.create(req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});
app.put('/api/users/:id', async (req, res) => {
  const u = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!u) return res.status(404).json({ error: 'User not found' });
  res.json(u);
});
app.delete('/api/users/:id', async (req, res) => {
  const u = await User.findByIdAndDelete(req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found' });
  res.json({ message: 'User deleted' });
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'Mongoose CRUD methods: find(), findById(), create(), findByIdAndUpdate(), findByIdAndDelete()',
          'All operations return Promises — use async/await',
          'Pass { new: true } to findByIdAndUpdate to get the updated document',
          'Always handle database errors with try/catch in route handlers',
        ],
      },
      {
        id: 'di-3',
        title: 'Relationships and Population',
        objectives: [
          'Model relationships between collections using ObjectId references',
          'Use the ref property to link related schemas',
          'Use .populate() to fetch related documents in a single query',
          'Understand one-to-one, one-to-many, and many-to-many relationships',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Connecting Data</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">In MongoDB, relationships are modeled by storing a reference (ObjectId) from one document to another. Mongoose's <code>.populate()</code> method automatically replaces these IDs with the actual documents.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// User schema</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> userSchema = <span class="text-blue-600">new</span> mongoose.<span class="text-purple-600">Schema</span>({</p>
            <p class="text-gray-700 mb-2">&nbsp;&nbsp;name: String, email: String</p>
            <p class="text-gray-700 mb-3">});</p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Post schema with reference to User</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> postSchema = <span class="text-blue-600">new</span> mongoose.<span class="text-purple-600">Schema</span>({</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;title: String,</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;content: String,</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;author: { type: mongoose.<span class="text-blue-600">Schema</span>.Types.ObjectId, ref: 'User' }</p>
            <p class="text-gray-700 mb-2">});</p>
            <p class="text-gray-700 mb-3">&nbsp;</p>
            <p class="text-gray-700 mb-2"><span class="text-gray-500">// Populate author when querying posts</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> posts = <span class="text-blue-600">await</span> Post.<span class="text-purple-600">find</span>().<span class="text-purple-600">populate</span>('author');</p>
          </div>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Relationship Types:</strong> One-to-one (User -> Profile), One-to-many (User -> Posts), Many-to-many (Students -> Courses). Mongoose handles all three with <code>ref</code> and <code>populate()</code>.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();

// Simulated models with relationships
const db = {
  users: [
    { _id: 'u1', name: 'Alice', email: 'alice@test.com' },
    { _id: 'u2', name: 'Bob', email: 'bob@test.com' },
  ],
  posts: [
    { _id: 'p1', title: 'First Post', content: 'Hello!', author: 'u1' },
    { _id: 'p2', title: 'Second Post', content: 'World!', author: 'u1' },
    { _id: 'p3', title: "Bob's Post", content: 'By Bob', author: 'u2' },
  ],
};

app.get('/api/posts', (req, res) => {
  // Simulate population: replace author ID with full user object
  const populated = db.posts.map(post => ({
    ...post,
    author: db.users.find(u => u._id === post.author) || post.author
  }));
  res.json(populated);
});

app.get('/api/users/:id/posts', (req, res) => {
  const userPosts = db.posts.filter(p => p.author === req.params.id);
  const populated = userPosts.map(post => ({
    ...post,
    author: db.users.find(u => u._id === post.author)
  }));
  res.json(populated);
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'Use ObjectId refs to model relationships between collections',
          'The ref property tells Mongoose which collection to join',
          'populate() replaces reference IDs with actual documents',
          'Relationships can be one-to-one, one-to-many, or many-to-many',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-di-1',
        question: 'What is Mongoose?',
        options: ['A database engine', 'An ODM (Object Document Mapper) for MongoDB', 'A query language', 'A server framework'],
        correct: 1,
      },
      {
        id: 'q-di-2',
        question: 'How do you define a model with Mongoose?',
        options: ['new Model(schema)', 'mongoose.model("Name", schema)', 'mongoose.create(schema)', 'Model.define(schema)'],
        correct: 1,
      },
      {
        id: 'q-di-3',
        question: 'What does .populate() do in Mongoose?',
        options: ['Deletes referenced documents', 'Replaces reference IDs with the actual referenced documents', 'Creates new collection indexes', 'Validates all document fields'],
        correct: 1,
      },
    ],
  },
  // ─── Module 8: Testing & Deployment ───
  {
    id: 'testing-deployment',
    title: 'Testing & Deployment',
    lessons: [
      {
        id: 'td-1',
        title: 'Unit Testing with Jest',
        objectives: [
          'Install and configure Jest for testing Express applications',
          'Write unit tests for utility functions and helpers',
          'Organize tests with describe and it blocks',
          'Use assertions to verify expected behavior',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Testing Your Code</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Jest is a popular testing framework for JavaScript. You write test files that describe what your code should do, and Jest runs them and reports pass/fail.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// math.js - the function to test</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">function</span> <span class="text-purple-600">add</span>(a, b) { <span class="text-blue-600">return</span> a + b; }</p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">function</span> <span class="text-purple-600">multiply</span>(a, b) { <span class="text-blue-600">return</span> a * b; }</p>
            <p class="text-gray-700 mb-3"><span class="text-blue-600">module.</span>exports = { add, multiply };</p>
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// math.test.js - the test file</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> { add, multiply } = <span class="text-blue-600">require</span>('./math');</p>
            <p class="text-gray-700 mb-3">&nbsp;</p>
            <p class="text-gray-700 mb-1"><span class="text-purple-600">describe</span>('Math functions', () => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-purple-600">test</span>('adds 1 + 2 to equal 3', () => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">expect</span>(<span class="text-purple-600">add</span>(1, <span class="text-orange-500">2</span>)).<span class="text-purple-600">toBe</span>(<span class="text-orange-500">3</span>);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;});</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-purple-600">test</span>('multiplies 3 * 4 to equal 12', () => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">expect</span>(<span class="text-purple-600">multiply</span>(<span class="text-orange-500">3</span>, <span class="text-orange-500">4</span>)).<span class="text-purple-600">toBe</span>(<span class="text-orange-500">12</span>);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;});</p>
            <p class="text-gray-700">});</p>
          </div>
          <p class="mb-4 text-gray-700 leading-relaxed">Run tests with <code>npx jest</code> or <code>npm test</code>. Jest will find files ending in <code>.test.js</code> or <code>.spec.js</code> and execute them, showing a pass/fail summary.</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Pro Tip:</strong> Write tests as you build features (TDD - Test Driven Development). It catches bugs early and gives you confidence when refactoring.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();

// Sample functions to test
function validateEmail(email) {
  return typeof email === 'string' && email.includes('@') && email.includes('.');
}

function calculateDiscount(price, percentage) {
  if (price < 0 || percentage < 0 || percentage > 100) {
    throw new Error('Invalid input');
  }
  return price - (price * percentage / 100);
}

// In a real project, you'd write tests like:
// test('validateEmail returns true for valid email', () => {
//   expect(validateEmail('test@test.com')).toBe(true);
// });
// test('calculateDiscount applies correct percentage', () => {
//   expect(calculateDiscount(100, 10)).toBe(90);
// });

app.get('/api/test-email', (req, res) => {
  const email = req.query.email;
  res.json({ email, valid: validateEmail(email) });
});

app.get('/api/test-discount', (req, res) => {
  const price = parseFloat(req.query.price) || 0;
  const pct = parseFloat(req.query.pct) || 0;
  try {
    res.json({ original: price, discount: pct, final: calculateDiscount(price, pct) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'Jest is a popular JavaScript testing framework',
          'Use describe/it/test blocks to organize test cases',
          'Use expect().toBe() for assertions',
          'Run tests with npm test or npx jest',
        ],
      },
      {
        id: 'td-2',
        title: 'Integration Testing with Supertest',
        objectives: [
          'Install Supertest for HTTP-level integration testing',
          'Write integration tests that make real HTTP requests to your Express app',
          'Test both success and error response paths',
          'Understand the difference between unit and integration tests',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Testing HTTP Endpoints</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Supertest is a library that lets you simulate HTTP requests against your Express app in tests. It's perfect for testing that your API endpoints return the correct status codes, headers, and body data.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">const</span> request = <span class="text-blue-600">require</span>('supertest');</p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> app = <span class="text-blue-600">require</span>('./app'); <span class="text-gray-500">// Your Express app</span></p>
            <p class="text-gray-700 mb-3">&nbsp;</p>
            <p class="text-gray-700 mb-1"><span class="text-purple-600">describe</span>('GET /api/users', () => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-purple-600">test</span>('responds with JSON array', <span class="text-blue-600">async</span> () => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">const</span> res = <span class="text-blue-600">await</span> request(app)</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.<span class="text-purple-600">get</span>('/api/users')</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.<span class="text-purple-600">expect</span>(<span class="text-orange-500">200</span>);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">expect</span>(res.body).<span class="text-purple-600">toEqual</span>(</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">expect</span>.arrayContaining([</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ id: <span class="text-orange-500">1</span>, name: 'Alice' }</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;])</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;});</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-purple-600">test</span>('returns 404 for unknown user', <span class="text-blue-600">async</span> () => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-blue-600">await</span> request(app)</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.<span class="text-purple-600">get</span>('/api/users/999')</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.<span class="text-purple-600">expect</span>(<span class="text-orange-500">404</span>);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;});</p>
            <p class="text-gray-700">});</p>
          </div>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Key Idea:</strong> Unit tests check individual functions. Integration tests check that your entire app (routes, middleware, database) works together correctly.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();
app.use(express.json());

const items = [
  { id: 1, name: 'Learn Express', done: false },
  { id: 2, name: 'Build an API', done: false },
];

app.get('/api/items', (req, res) => res.json(items));

app.get('/api/items/:id', (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

app.post('/api/items', (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: 'Name required' });
  const item = { id: items.length + 1, name: req.body.name, done: false };
  items.push(item);
  res.status(201).json(item);
});

// In production, you'd test this with supertest:
// const request = require('supertest')(app);
// test('GET /api/items returns array', async () => {
//   const res = await request.get('/api/items').expect(200);
//   expect(Array.isArray(res.body)).toBe(true);
// });

app.listen(3000, () => console.log('Server started'));`,
        takeaways: [
          'Supertest simulates HTTP requests against your Express app in tests',
          'Integration tests verify that the full request-response cycle works',
          'Test both success (200) and error (400, 404, 500) responses',
          'Integration tests complement unit tests for complete coverage',
        ],
      },
      {
        id: 'td-3',
        title: 'Environment Variables and Deployment',
        objectives: [
          'Use environment variables for configuration with dotenv',
          'Set NODE_ENV for development vs production behavior',
          'Prepare an Express app for production deployment',
          'Deploy to cloud platforms like Render or Railway',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Going to Production</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Before deploying your Express app, you need to configure it for production. This means using environment variables, setting the right port, and handling errors gracefully.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Load environment variables</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> dotenv = <span class="text-blue-600">require</span>('dotenv');</p>
            <p class="text-gray-700 mb-3">dotenv.<span class="text-purple-600">config</span>();</p>
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Use environment variables</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> port = <span class="text-blue-600">process</span>.env.PORT || <span class="text-orange-500">3000</span>;</p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> dbUri = <span class="text-blue-600">process</span>.env.MONGODB_URI;</p>
            <p class="text-gray-700 mb-3">&nbsp;</p>
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Production-friendly error handler</span></p>
            <p class="text-gray-700 mb-1">app.<span class="text-purple-600">use</span>((err, req, res, next) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">const</span> message = <span class="text-blue-600">process</span>.env.NODE_ENV === 'production'</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;? 'Internal server error'</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;: err.message;</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;res.<span class="text-purple-600">status</span>(<span class="text-orange-500">500</span>).<span class="text-purple-600">json</span>({ error: message });</p>
            <p class="text-gray-700">});</p>
          </div>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
            <p class="text-yellow-800"><strong>Important:</strong> Always use <code>process.env.PORT</code> instead of hardcoding a port. Deployment platforms assign a random port at runtime. Never commit your <code>.env</code> file to version control!</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();

// Use environment variable for port (with fallback)
const port = process.env.PORT || 3000;
const nodeEnv = process.env.NODE_ENV || 'development';

console.log('Starting in ' + nodeEnv + ' mode on port ' + port);

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from Express!',
    environment: nodeEnv,
    port: port
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    nodeEnv,
    port,
    // Never expose secrets! Only show safe config
    features: {
      detailedErrors: nodeEnv !== 'production',
      logLevel: nodeEnv === 'production' ? 'error' : 'debug'
    }
  });
});

// Production-ready start
app.listen(port, () => {
  console.log('Server running on port ' + port + ' in ' + nodeEnv + ' mode');
});`,
        takeaways: [
          'Use dotenv to load environment variables from a .env file',
          'Always use process.env.PORT for the server port',
          'Set NODE_ENV to "production" for optimized behavior',
          'Never commit .env files to version control',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-td-1',
        question: 'What is the purpose of unit testing?',
        options: ['Test the entire application at once', 'Test individual functions in isolation', 'Test only the database layer', 'Test user interface elements'],
        correct: 1,
      },
      {
        id: 'q-td-2',
        question: 'What does Supertest allow you to do?',
        options: ['Write unit tests for pure functions', 'Simulate HTTP requests against your Express app in tests', 'Test database queries directly', 'Generate API documentation automatically'],
        correct: 1,
      },
      {
        id: 'q-td-3',
        question: 'How do you access environment variables in Node.js?',
        options: ['env.VAR_NAME', 'process.env.VAR_NAME', 'global.env.VAR_NAME', 'config.VAR_NAME'],
        correct: 1,
      },
    ],
  },
  // ─── Module 9: Capstone ───
  {
    id: 'capstone',
    title: 'Capstone Project',
    lessons: [
      {
        id: 'cp-1',
        title: 'Project Planning and Setup',
        objectives: [
          'Plan a full Express API project from requirements',
          'Set up the project structure with organized folders',
          'Initialize npm and install required dependencies',
          'Create the entry point and basic Express app scaffold',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Planning Your API</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">A well-planned project saves time and prevents architectural issues. Before writing code, define your API endpoints, data models, and folder structure.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Recommended project structure</span></p>
            <p class="text-gray-700 mb-1">my-express-api/</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;├── src/</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;│&nbsp;&nbsp;├── routes/       <span class="text-gray-500">// Route definitions</span></p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;│&nbsp;&nbsp;│&nbsp;&nbsp;├── users.js</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;│&nbsp;&nbsp;│&nbsp;&nbsp;├── products.js</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;│&nbsp;&nbsp;│&nbsp;&nbsp;└── orders.js</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;│&nbsp;&nbsp;├── middleware/   <span class="text-gray-500">// Custom middleware</span></p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;│&nbsp;&nbsp;├── models/      <span class="text-gray-500">// Mongoose models</span></p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;│&nbsp;&nbsp;├── controllers/ <span class="text-gray-500">// Route handlers</span></p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;│&nbsp;&nbsp;└── app.js       <span class="text-gray-500">// Express setup</span></p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;├── tests/          <span class="text-gray-500">// Test files</span></p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;├── .env             <span class="text-gray-500">// Environment variables</span></p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;├── package.json</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;└── server.js        <span class="text-gray-500">// Entry point</span></p>
          </div>
          <ul class="list-disc pl-6 mb-4 text-gray-700 space-y-1">
            <li>Define your API endpoints before coding (e.g., RESTful resource routes)</li>
            <li>Plan your data models and their relationships</li>
            <li>Decide on authentication strategy (JWT is common for APIs)</li>
            <li>Set up linting and testing from the start</li>
          </ul>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Pro Tip:</strong> Use <code>npm init -y</code> to quickly scaffold. Install express, mongoose, dotenv, cors, and helmet as a solid foundation for most APIs.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();

// Core middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Placeholder routes (to be implemented in cp-2)
app.use('/api/users', (req, res) => res.json({ message: 'Users router TBD' }));
app.use('/api/products', (req, res) => res.json({ message: 'Products router TBD' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Capstone API server running on port ' + PORT);
});`,
        takeaways: [
          'Plan your API endpoints and data models before coding',
          'Use a consistent folder structure (routes, models, middleware, controllers)',
          'Set up core middleware (JSON parser, CORS, helmet) early',
          'Start with a health check endpoint for monitoring',
        ],
      },
      {
        id: 'cp-2',
        title: 'Building the API Endpoints',
        objectives: [
          'Implement full CRUD endpoints for a resource',
          'Add request validation and error handling',
          'Implement authentication for protected routes',
          'Test endpoints using the API Simulator',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Building the Main Features</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Now you'll build the actual API endpoints. Start with one resource (e.g., Items) and implement full CRUD with validation, auth, and error handling.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// itemsRouter.js - Full CRUD for a resource</span></p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">const</span> router = express.<span class="text-purple-600">Router</span>();</p>
            <p class="text-gray-700 mb-3">&nbsp;</p>
            <p class="text-gray-700 mb-1">router.<span class="text-purple-600">get</span>('/', <span class="text-blue-600">async</span> (req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">const</span> items = <span class="text-blue-600">await</span> Item.<span class="text-purple-600">find</span>();</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;res.<span class="text-purple-600">json</span>(items);</p>
            <p class="text-gray-700 mb-1">});</p>
            <p class="text-gray-700 mb-3">&nbsp;</p>
            <p class="text-gray-700 mb-1">router.<span class="text-purple-600">post</span>('/', authenticate, <span class="text-blue-600">async</span> (req, res) => {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;<span class="text-blue-600">const</span> item = <span class="text-blue-600">await</span> Item.<span class="text-purple-600">create</span>(req.body);</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;res.<span class="text-purple-600">status</span>(<span class="text-orange-500">201</span>).<span class="text-purple-600">json</span>(item);</p>
            <p class="text-gray-700 mb-1">});</p>
            <p class="text-gray-700 mb-3">&nbsp;</p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">module</span>.exports = router;</p>
          </div>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium"><strong>Build Order:</strong> Start with models (data structure), then routes (endpoints), then controllers (business logic), then middleware (auth, validation). Test each piece before moving to the next.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();
app.use(express.json());

// Simulated database
let items = [
  { id: 1, name: 'Build an Express API', done: false, userId: 1 },
  { id: 2, name: 'Add validation', done: false, userId: 1 },
  { id: 3, name: 'Write tests', done: false, userId: 1 },
];

// Simple auth middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Auth required' });
  req.user = { id: 1, role: 'user' };
  next();
}

// CRUD endpoints for Items
app.get('/api/items', (req, res) => res.json(items));

app.get('/api/items/:id', (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

app.post('/api/items', authenticate, (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: 'Name is required' });
  const item = { id: items.length + 1, name: req.body.name, done: false, userId: req.user.id };
  items.push(item);
  res.status(201).json(item);
});

app.put('/api/items/:id', authenticate, (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  Object.assign(item, req.body, { id: item.id });
  res.json(item);
});

app.delete('/api/items/:id', authenticate, (req, res) => {
  const idx = items.findIndex(i => i.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  items.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

app.listen(3000, () => console.log('Capstone API running'));`,
        takeaways: [
          'Implement one resource at a time with full CRUD',
          'Add authentication and validation middleware',
          'Test each endpoint as you build it',
          'Handle errors gracefully with proper status codes',
        ],
      },
      {
        id: 'cp-3',
        title: 'Testing, Deployment and Wrap-Up',
        objectives: [
          'Write integration tests for your API endpoints',
          'Prepare the app for production deployment',
          'Understand the deployment process on platforms like Render',
          'Reflect on the full Express development lifecycle',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">From Development to Production</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The final step is testing everything and deploying. Write integration tests for all endpoints, prepare your app for production, and deploy to a cloud platform.</p>
          <div class="bg-gray-50 border rounded-lg p-4 my-6 font-mono text-sm">
            <p class="text-gray-700 mb-2"><span class="text-blue-600">// Deploy checklist</span></p>
            <p class="text-gray-700 mb-1">[ ] All routes return correct status codes</p>
            <p class="text-gray-700 mb-1">[ ] Validation returns clear error messages</p>
            <p class="text-gray-700 mb-1">[ ] Auth middleware protects private routes</p>
            <p class="text-gray-700 mb-1">[ ] Error handler returns consistent JSON</p>
            <p class="text-gray-700 mb-1">[ ] Environment variables are configured</p>
            <p class="text-gray-700 mb-1">[ ] CORS is configured for the frontend URL</p>
            <p class="text-gray-700 mb-1">[ ] package.json has "start" script</p>
            <p class="text-gray-700 mb-3">[ ] .env file is in .gitignore</p>
            <p class="text-gray-700 mb-3">&nbsp;</p>
            <p class="text-gray-700 mb-1"><span class="text-blue-600">// Example start script in package.json</span></p>
            <p class="text-gray-700">{</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;"scripts": {</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;"start": "node src/server.js",</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;"dev": "nodemon src/server.js",</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;&nbsp;&nbsp;"test": "jest --coverage"</p>
            <p class="text-gray-700 mb-1">&nbsp;&nbsp;}</p>
            <p class="text-gray-700">}</p>
          </div>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Congratulations!</strong> You've completed the Express Academy capstone. You now have a production-ready Express API structure. The full Express lifecycle: Plan -> Build -> Test -> Deploy.</p>
          </div>
        `,
        defaultCode: `const express = require('express');
const app = express();
app.use(express.json());

// Final capstone app
const items = [
  { id: 1, name: 'Learn Express', done: true },
  { id: 2, name: 'Build an API', done: true },
  { id: 3, name: 'Write tests', done: false },
  { id: 4, name: 'Deploy', done: false },
];

app.get('/api/items', (req, res) => res.json(items));

app.post('/api/items', (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: 'Name required' });
  const item = { id: items.length + 1, name: req.body.name, done: false };
  items.push(item);
  res.status(201).json(item);
});

// Catch-all error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('=== Express Academy Complete ===');
  console.log('API ready on port ' + PORT);
  console.log('Endpoints:');
  console.log('  GET  /api/items');
  console.log('  POST /api/items');
});`,
        takeaways: [
          'Write integration tests before deploying',
          'Use a deployment checklist to avoid common mistakes',
          'Configure CORS, error handling, and environment variables for production',
          'You now have the skills to build and deploy Express APIs independently',
        ],
      },
    ],
    quiz: [
      {
        id: 'q-cp-1',
        question: 'What is the first step in building a new Express project?',
        options: ['Write all the code at once', 'Plan the API endpoints and project structure', 'Deploy immediately', 'Install every npm package you can think of'],
        correct: 1,
      },
      {
        id: 'q-cp-2',
        question: 'Why test endpoints before deploying?',
        options: ['It is mandatory', 'To catch bugs early and ensure reliability', 'To slow down the development process', 'None of the above'],
        correct: 1,
      },
      {
        id: 'q-cp-3',
        question: 'What should be included in package.json scripts for an Express app?',
        options: ['Only "start"', '"start", "dev" (with nodemon), and "test"', 'Only "test"', 'No scripts needed'],
        correct: 1,
      },
    ],
  },
];



