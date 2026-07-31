/**
 * ELI5 (Explain Like I'm 5) content for Express Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5ExpressData = {
  // ─── Module 1: Express Basics & Routing ───
  'eb-1': `
    <p>Think of Express as a <strong>super-organized waiter at a restaurant</strong>.</p>
    <p>The Node.js kitchen cooks all the food, but the waiter (Express) takes your order, brings it to the chef, and serves you the finished meal. Without a waiter, you'd have to walk into the kitchen and cook everything yourself!</p>
    <p><strong>Routes</strong> are like menu items. You tell the waiter: "When someone asks for <code>/</code> (the homepage), bring them the <strong>Welcome</strong> dish. When someone asks for <code>/api/users</code>, bring them the <strong>User List</strong> dish."</p>
    <p>The <code>app.get()</code> part says "I only handle GET orders" — like a waiter who only takes orders but doesn't deliver anything heavy.</p>
    <p>And <code>app.listen(3000)</code> is like opening the restaurant on street number <strong>3000</strong> — it's the door where customers come in!</p>
  `,
  'eb-2': `
    <p>Imagine you're a <strong>postal worker</strong> sorting mail.</p>
    <p>A <strong>route parameter</strong> is like a <strong>mail slot number</strong>. If the address says "Apartment <code>:id</code>", you look at the actual number on the letter and deliver to that specific apartment. In Express, <code>/users/:id</code> means "grab whatever is in this spot in the URL and call it <code>id</code>".</p>
    <p>A <strong>query string</strong> is like <strong>delivery instructions on the envelope</strong>. <code>?sort=asc&page=2</code> means "please sort this by ascending order and give me page 2". These are extra options that filter or change the result without changing the main address.</p>
    <p>Route parameters = <strong>WHAT</strong> you want. Query strings = <strong>HOW</strong> you want it.</p>
  `,
  'eb-3': `
    <p>Think of <code>express.Router()</code> as a <strong>mini-waiter</strong> for a specific section of the restaurant.</p>
    <p>If you have a huge restaurant with a Salad Bar, a Grill Station, and a Dessert Counter, you wouldn't have one waiter running everywhere. You'd have <strong>one waiter per station</strong> — each knows their own menu and handles their own orders.</p>
    <p>In Express, you create a <strong>Router</strong> for users (<code>/users</code>), another for products (<code>/products</code>), and another for orders (<code>/orders</code>). Each router only handles its own paths. Then you connect them all in the main <code>app.js</code> like a head waiter assigning sections.</p>
    <p>This keeps your code organized — like having separate binders instead of one giant notebook!</p>
  `,
  'eb-4': `
    <p>Imagine your website has <strong>photos, CSS files, and JavaScript files</strong> that every page needs — like a logo that appears on every page of a magazine.</p>
    <p>Instead of writing a special handler for each file, <code>express.static()</code> is like saying: <strong>"Here's a public filing cabinet — anyone can grab whatever they want from it."</strong></p>
    <p>You point to a folder (like <code>public</code>), and Express automatically serves any file inside it. If someone asks for <code>/images/cat.jpg</code>, Express looks in <code>public/images/cat.jpg</code> and hands it over.</p>
    <p>It's like putting your toys in a toy box with "FREE" written on it — kids (browsers) can just walk up and take what they want without asking permission!</p>
  `,

  // ─── Module 2: Middleware ───
  'mw-1': `
    <p>Imagine a <strong>car wash</strong>. Your car (the request) drives through a series of stations:</p>
    <ol>
      <li><strong>Soap spray</strong> — cleans the dirt (logs the request)</li>
      <li><strong>Brush rollers</strong> — scrub the surface (checks if user is logged in)</li>
      <li><strong>Rinse</strong> — washes off the soap (parses the request body)</li>
      <li><strong>Dry</strong> — finishes the job (sends the response)</li>
    </ol>
    <p>Each station is a <strong>middleware function</strong>. It does one job and then calls <code>next()</code> to send the car to the next station. If a station can't handle the job, it calls <code>next()</code> anyway — the car just passes through.</p>
    <p>Middleware can also <strong>stop the car</strong> if something is wrong — like a security gate that stops the car if the driver doesn't have a ticket (<code>res.send()</code> or <code>res.json()</code> ends the cycle).</p>
  `,
  'mw-2': `
    <p>Express comes with some <strong>built-in tools</strong>, like a Swiss Army knife that's already in your pocket.</p>
    <ul>
      <li><strong><code>express.json()</code></strong> — This is like having a <strong>translator</strong> at the door. When someone sends JSON data (a language Express doesn't speak by default), this middleware translates it into a JavaScript object and puts it on <code>req.body</code>.</li>
      <li><strong><code>express.urlencoded()</code></strong> — Same thing, but for form data (like when you submit a contact form on a website).</li>
      <li><strong><code>express.static()</code></strong> — Like a <strong>self-serve buffet</strong>. You point to a folder and anyone can grab files from it without needing a special route.</li>
    </ul>
    <p>You don't need to install anything extra — these are <strong>free tools included with Express</strong>!</p>
  `,
  'mw-3': `
    <p>If Express built-in tools are your Swiss Army knife, <strong>third-party middleware</strong> is like going to a hardware store and buying specialized tools.</p>
    <ul>
      <li><strong><code>morgan</code></strong> — A <strong>security camera</strong> that logs every request: "GET /api/users at 2:30 PM — 200 OK". Helps you see who's visiting your app.</li>
      <li><strong><code>cors</code></strong> — A <strong>bouncer</strong> at the club door. By default, browsers block requests from other websites for security. CORS says "It's OK, let them in!"</li>
      <li><strong><code>helmet</code></strong> — A <strong>bodyguard</strong> that adds extra security headers to protect your app from common web attacks.</li>
    </ul>
    <p>Just <code>npm install</code> the tool, then <code>app.use()</code> it — like plugging in a new appliance!</p>
  `,
  'mw-4': `
    <p>Imagine you're running a <strong>factory assembly line</strong>. Everything is going smoothly until — <strong>CRASH</strong>! A machine breaks down.</p>
    <p>You need a <strong>safety net</strong> at the end of the line that catches anything that goes wrong. That's <strong>error-handling middleware</strong>.</p>
    <p>Unlike regular middleware (which takes <code>req, res, next</code>), this special middleware takes <strong>FOUR</strong> parameters: <code>(err, req, res, next)</code>. Express knows it's an error handler because of those 4 parameters.</p>
    <p>When something breaks, instead of calling <code>next()</code>, you call <code>next(err)</code> — like pulling an emergency cord. The error skips all the other middleware and goes straight to the error handler, which says "Don't panic! Here's a nice error message."</p>
    <p>Without this, Express would just crash and the user would see a blank white page with a scary <strong>"Cannot GET /something"</strong> message.</p>
  `,

  // ─── Module 3: Building REST APIs (CRUD) ───
  'crud-1': `
    <p>POST is like <strong>ordering a custom pizza</strong>.</p>
    <p>You call the pizza place (send a request to the server) and say exactly what you want: "I want a large pepperoni pizza with extra cheese." That information is the <strong>request body</strong> — it comes <strong>inside</strong> the request, not in the URL.</p>
    <p>The server takes your order (the data), creates a new pizza (a new record in the database), and hands you back a receipt showing the order ID and your pizza details. In Express terms: you <code>POST</code> data, the server saves it, and sends back <strong>201 Created</strong> (the receipt).</p>
    <p>Without <code>express.json()</code>, the server can't read your pizza order — it's like the waiter doesn't speak English!</p>
  `,
  'crud-2': `
    <p>GET is like <strong>looking at a menu</strong> — you're just reading, not changing anything.</p>
    <p>When you GET a list of users (<code>GET /api/users</code>), it's like flipping through a photo album — you see everyone's picture but you're not drawing mustaches on them!</p>
    <p>When you GET a single user (<code>GET /api/users/3</code>), it's like opening the album to page 3 — you see just that one person's photo.</p>
    <p>GET requests are <strong>safe</strong> (they never change anything) and <strong>idempotent</strong> (asking 10 times gives the same result as asking once — the menu doesn't change just because you read it).</p>
    <p>Think of GET as <strong>"read-only mode"</strong> — you're a library visitor browsing books, not writing in them!</p>
  `,
  'crud-3': `
    <p>PUT and PATCH are like <strong>editing a document</strong>.</p>
    <p><strong>PUT</strong> is like <strong>replacing the entire page</strong>. If you have a profile page with your name, photo, and bio, and you PUT a new profile, you're replacing everything — name, photo, and bio all at once. If you forget to include your photo, it disappears!</p>
    <p><strong>PATCH</strong> is like using <strong>white-out on one line</strong>. You just change your bio and leave everything else (name, photo) alone.</p>
    <p>In practice: Use <strong>PUT</strong> when you're sending the <strong>full resource</strong>. Use <strong>PATCH</strong> when you're sending <strong>only the changes</strong>.</p>
    <p>Both require you to find the right document first — that's what the <code>:id</code> route parameter is for. "Find document #5 and update it."</p>
  `,
  'crud-4': `
    <p>DELETE is like <strong>throwing something in the trash</strong>.</p>
    <p>You find the item you want to remove (by its <code>:id</code>), and then you <strong>delete it</strong>. Gone. Poof.</p>
    <p>In a real REST API, you'd usually do a <strong>soft delete</strong> (like putting something in a recycle bin) rather than a <strong>hard delete</strong> (throwing it in an incinerator). Soft delete just marks the item as "deleted" but keeps it in the database — like moving a file to the Trash folder instead of emptying it.</p>
    <p>After deleting, the server sends back <strong>200 OK</strong> (with a confirmation message) or <strong>204 No Content</strong> (meaning "Done! Nothing to show."). If the item doesn't exist, it returns <strong>404 Not Found</strong> — "That item is already gone or never existed!"</p>
    <p><strong>Important:</strong> DELETE is permanent (or semi-permanent). Only do it when you're sure!</p>
  `,

  // ─── Module 4: Request Validation ───
  'rv-1': `
    <p>Imagine you're a <strong>bank teller</strong>. Someone hands you a withdrawal slip that says "Give me $1,000,000!" but they only have $5 in their account.</p>
    <p>If you just hand over the money without checking, <strong>bad things happen</strong>. You need to <strong>validate</strong> the request first: "Do you have enough money? Is the account number valid? Is the signature real?"</p>
    <p>In Express, <strong>request validation</strong> is the same idea. Users might send:</p>
    <ul>
      <li>Missing required fields (like forgetting their name on a sign-up form)</li>
      <li>Wrong data types (sending text where a number is expected)</li>
      <li>Malicious code trying to break your database</li>
    </ul>
    <p>Validation is like checking someone's ID before letting them into a club — it keeps the bad actors out and ensures the good users have a smooth experience.</p>
  `,
  'rv-2': `
    <p>Before using fancy validation libraries, you can validate data <strong>manually</strong> — like a lifeguard checking each swimmer one at a time.</p>
    <p>You check: "Does <code>req.body.email</code> exist? Does it have an <code>@</code> symbol? Is the password at least 8 characters?" If any check fails, you send back a <strong>400 Bad Request</strong> with a clear error message.</p>
    <p>Manual validation is like <strong>checking ingredients by hand</strong> when baking a cake:</p>
    <ul>
      <li>Do we have eggs? (Check if field exists)</li>
      <li>Are the eggs fresh? (Check if value is valid)</li>
      <li>How many eggs? (Check if count is right)</li>
    </ul>
    <p>It works but gets messy when you have many fields — like checking 50 ingredients by hand instead of using a machine!</p>
  `,
  'rv-3': `
    <p>If manual validation is checking ingredients by hand, <strong>express-validator</strong> is a <strong>kitchen appliance</strong> that does it automatically.</p>
    <p>You tell the machine your rules: "The email field must be a valid email. The password must be at least 8 characters. The age must be between 18 and 120." Then it checks everything at once and gives you a list of all the errors found.</p>
    <p>It's like a <strong>bouncer with a clipboard</strong> at the club door:</p>
    <ul>
      <li>"Name? Check. On the list. ✅"</li>
      <li>"ID? Check. Over 21. ✅"</li>
      <li>"Fancy dress? Check. No sportswear. ✅"</li>
    </ul>
    <p>Using <code>body('email').isEmail()</code> is like saying "Check that the email field contains a real email address." If it doesn't, the bouncer (validator) says "Sorry, invalid email!" and the door stays closed (400 error).</p>
  `,
  'rv-4': `
    <p><strong>Sanitization</strong> is like <strong>washing fruits and vegetables</strong> before cooking.</p>
    <p>A user might send <code>"<script>alert('hack!')</script>"</code> in a comment field. If you save that directly to your database and display it on a webpage, the script runs and potentially steals user data (this is called <strong>XSS — Cross-Site Scripting</strong>).</p>
    <p>Sanitization cleans the input: it removes dangerous characters, trims whitespace, escapes HTML entities — like washing dirt off an apple before eating it.</p>
    <p>With express-validator, you chain <strong>sanitizers</strong> after validators:</p>
    <ul>
      <li><code>trim()</code> — Removes extra spaces at the start/end (like trimming fat off meat)</li>
      <li><code>escape()</code> — Converts <code><</code> to <code>&amp;lt;</code> (like putting a protective cover on sharp edges)</li>
      <li><code>toInt()</code> — Converts a string to a number (like changing coins into a bill)</li>
    </ul>
    <p><strong>Always sanitize!</strong> Never trust user input — treat it like unwashed produce!</p>
  `,

  // ─── Module 5: Error Handling ───
  'eh-1': `
    <p>Imagine you're driving a car and the <strong>"Check Engine" light turns on</strong>.</p>
    <p>You have two choices:</p>
    <ol>
      <li>Ignore it and hope the car keeps running (bad — the engine might explode!)</li>
      <li>Pull over, check what's wrong, and tell the driver (the user) what happened</li>
    </ol>
    <p>In Express, errors are like the "Check Engine" light. When something breaks — a database connection fails, a file isn't found, a user sends bad data — you need to <strong>catch the error</strong> and <strong>respond properly</strong> instead of crashing.</p>
    <p>Express has two types of errors:</p>
    <ul>
      <li><strong>Synchronous errors</strong> — Like tripping on a crack in the sidewalk. Easy to catch!</li>
      <li><strong>Asynchronous errors</strong> — Like a delayed flight. Harder to catch because they happen later.</li>
    </ul>
    <p>A try-catch block is like carrying a safety net — it catches you when you fall.</p>
  `,
  'eh-2': `
    <p>A <strong>custom error class</strong> is like designing your own <strong>specialized warning lights</strong> for different problems.</p>
    <p>A regular error is a generic "Something went wrong" — like a red light that just says "STOP". You don't know WHY you should stop.</p>
    <p>Custom errors are specific:</p>
    <ul>
      <li><code>NotFoundError</code> — "User not found" (like a "Road Closed" sign)</li>
      <li><code>ValidationError</code> — "Email is invalid" (like a "Wrong Way" sign)</li>
      <li><code>UnauthorizedError</code> — "You must log in" (like a "Private Property" sign)</li>
    </ul>
    <p>Each custom error can carry extra information — like an error code, a status code, or details about what went wrong. This makes handling them much easier later, like a mechanic who knows exactly which part failed!</p>
  `,
  'eh-3': `
    <p>Handling errors in async code is like <strong>catching a ball that someone throws 5 seconds later</strong>.</p>
    <p>You can't catch it now — you have to wait for the throw and then catch it. In JavaScript, we use <code>async/await</code> with <code>try/catch</code> blocks.</p>
    <p>Here's the problem: Express doesn't automatically catch errors from async functions. If an async route handler throws an error, Express doesn't know about it — the request just hangs forever like a phone call nobody answers!</p>
    <p>You need to wrap your async handlers with a <strong>catch-all</strong> that catches the error and passes it to Express using <code>next(error)</code>. A common pattern is an <strong>async wrapper function</strong> that does this automatically — like having a friend catch that delayed ball for you!</p>
  `,
  'eh-4': `
    <p>A <strong>centralized error handler</strong> is like a <strong>single help desk</strong> that handles every complaint in a big company.</p>
    <p>Instead of each department handling complaints their own way (one writes emails, another makes phone calls, another sends letters), they all forward complaints to ONE help desk that handles everything consistently.</p>
    <p>In Express, you create ONE error-handling middleware at the end of your file (after all routes) with 4 parameters: <code>(err, req, res, next)</code>. Every error in your app flows to this single place.</p>
    <p>This centralized handler can:</p>
    <ul>
      <li>Log the error (so developers know about it)</li>
      <li>Send the right HTTP status code (404, 500, etc.)</li>
      <li>Return a user-friendly error message</li>
      <li>Hide internal details (don't tell hackers your database name!)</li>
    </ul>
    <p>It's like having a <strong>fire evacuation plan</strong> — everyone knows where to go and what to do when something goes wrong!</p>
  `,

  // ─── Module 6: Authentication & Auth ───
  'aa-1': `
    <p>Think of a <strong>theme park</strong>.</p>
    <p><strong>Authentication</strong> is showing your <strong>ticket at the entrance</strong> — the guard checks if your ticket is real and not expired. "Yes, you are who you say you are. Come in!"</p>
    <p><strong>Authorization</strong> is what the guard does AFTER you're inside — checking if your ticket allows you on the roller coaster, or only the kiddie rides. "You have a VIP pass? You can go on all rides!"</p>
    <p>In web apps:</p>
    <ul>
      <li><strong>Authentication</strong> = "Who are you?" (login with username + password)</li>
      <li><strong>Authorization</strong> = "What are you allowed to do?" (admin vs regular user)</li>
    </ul>
    <p>Authentication comes first. You can't decide what someone can do until you know who they are!</p>
  `,
  'aa-2': `
    <p>A <strong>JWT (JSON Web Token)</strong> is like a <strong>stamped hand at a music festival</strong>.</p>
    <p>When you enter the festival, security stamps your hand with a special ink that glows under UV light. Throughout the day, you can leave and re-enter just by showing your hand — no need to show your ID and ticket again.</p>
    <p>In web apps, when you log in, the server gives you a JWT (the hand stamp). Your browser stores it and sends it with every request. The server checks the JWT and knows "Oh, this is Alice! She has a VIP pass!"</p>
    <p>A JWT contains three parts:</p>
    <ol>
      <li><strong>Header</strong> — The type of ink used (how the token was created)</li>
      <li><strong>Payload</strong> — What's written on your hand (user ID, role, expiration time)</li>
      <li><strong>Signature</strong> — The secret UV pattern that proves it's real (can't be faked)</li>
    </ol>
    <p>A JWT is <strong>signed, not encrypted</strong> — anyone can read it, but only the server can create a valid one!</p>
  `,
  'aa-3': `
    <p>Protecting routes with middleware is like having a <strong>bouncer at each section of a VIP club</strong>.</p>
    <p>The main entrance checks your ID (authentication). Then inside, there are separate bouncers for:</p>
    <ul>
      <li>The <strong>VIP Lounge</strong> — only premium members</li>
      <li>The <strong>Staff Area</strong> — only employees</li>
      <li>The <strong>Dance Floor</strong> — everyone is welcome</li>
    </ul>
    <p>In Express, you create a <strong>middleware function</strong> that checks the JWT from the request header. If it's valid, call <code>next()</code> and let them through. If not, send a <strong>401 Unauthorized</strong> error.</p>
    <p>You can apply this middleware to specific routes: <code>app.get('/dashboard', authMiddleware, handler)</code>. The bouncer checks first, then the route runs!</p>
  `,
  'aa-4': `
    <p><strong>Role-Based Access Control (RBAC)</strong> is like a <strong>company building with different access levels</strong>.</p>
    <ul>
      <li><strong>Guests</strong> — Can only visit the lobby (public pages)</li>
      <li><strong>Employees</strong> — Can access the office floors (user features)</li>
      <li><strong>Managers</strong> — Can access the executive floor (admin features)</li>
      <li><strong>IT Admins</strong> — Can access the server room (super admin features)</li>
    </ul>
    <p>Each user has a <strong>role</strong> stored in their JWT. When they try to access a resource, a middleware checks: "Does this role have permission for this action?"</p>
    <p>For example: A regular user can view their own profile. A moderator can edit anyone's posts. An admin can delete the entire database (but hopefully they won't!).</p>
    <p>RBAC is like <strong>keycards in a hotel</strong> — your key opens your room, but not the manager's office or the rooftop pool!</p>
  `,

  // ─── Module 7: Database Integration ───
  'di-1': `
    <p>Connecting Express to a database is like <strong>connecting a hose to a faucet</strong>.</p>
    <p>Your Express app (the hose) needs water (data) to do anything useful. The database (the faucet) has all the water. You need to connect them properly so water can flow!</p>
    <p>MongoDB is like a <strong>big filing cabinet</strong> where each drawer is a "collection" (like "Users" or "Products") and each folder inside is a "document" (like one specific user's data).</p>
    <p>Mongoose is a <strong>helper tool</strong> that makes it easier to talk to MongoDB. It's like a translator who speaks both "Node.js language" and "MongoDB language" — you describe your data structure once, and Mongoose handles the translation automatically.</p>
    <p>Without Mongoose, you'd have to write everything in "MongoDB language" — like speaking a foreign language without a dictionary!</p>
  `,
  'di-2': `
    <p>Once you're connected to MongoDB through Mongoose, doing CRUD is like using a <strong>vending machine</strong>.</p>
    <ul>
      <li><strong>Create</strong> — <code>User.create(data)</code> = Putting a new snack in the machine</li>
      <li><strong>Read</strong> — <code>User.find()</code> = Looking at all snacks through the glass</li>
      <li><strong>Update</strong> — <code>User.findByIdAndUpdate(id, data)</code> = Replacing an old snack with a new one</li>
      <li><strong>Delete</strong> — <code>User.findByIdAndDelete(id)</code> = Removing a snack that's expired</li>
    </ul>
    <p>Mongoose gives you simple methods like <code>.find()</code>, <code>.findById()</code>, <code>.create()</code>, <code>.findByIdAndUpdate()</code>, and <code>.findByIdAndDelete()</code>. They're like <strong>buttons on the vending machine</strong> — you press the right button and get the right result!</p>
  `,
  'di-3': `
    <p><strong>Relationships</strong> in databases are like <strong>connections between people</strong>.</p>
    <p>A User <strong>has many</strong> Posts. A Post <strong>belongs to</strong> a User. A User <strong>has many</strong> Friends (and Friends are also Users!).</p>
    <p>In Mongoose, you use a <code>ref</code> to connect collections — like linking a child's school ID card to their parent's wallet. Instead of storing the parent's entire address book in the child's card, you just store the parent's ID number (<code>ref</code>) and look them up when needed.</p>
    <p><strong>Population</strong> is Mongoose's superpower. When you query a Post, you can <strong>populate</strong> the author field to get the full User data. It's like finding a library book (Post) and immediately knowing which person (User) borrowed it last — without having to search through a separate card catalog!</p>
  `,

  // ─── Module 8: Testing & Deployment ───
  'td-1': `
    <p>Testing is like <strong>checking your homework before turning it in</strong>.</p>
    <p>You write a test once, and it runs <strong>every time</strong> you make changes to make sure nothing broke. It's like having a robot that checks your math homework in 1 second instead of doing it by hand!</p>
    <p><strong>Jest</strong> is a popular testing tool for JavaScript. You write test files that describe what your code should do:</p>
    <ul>
      <li>"When I add 2 + 2, it should equal 4"</li>
      <li>"When I call getUser(5), it should return the user with ID 5"</li>
    </ul>
    <p>Each test is like a <strong>checklist item</strong>. When all items are checked (✅), you know your code works. When one fails (❌), you know exactly what broke!</p>
    <p>Tests give you <strong>confidence</strong> — like wearing a seatbelt while driving!</p>
  `,
  'td-2': `
    <p>If unit tests check individual pieces, <strong>integration tests</strong> check if the <strong>whole machine works together</strong>.</p>
    <p>Think of a <strong>bicycle</strong>:</p>
    <ul>
      <li><strong>Unit test</strong> = Test the wheels separately, the pedals separately, the chain separately</li>
      <li><strong>Integration test</strong> = Put the bike together and actually ride it!</li>
    </ul>
    <p><strong>Supertest</strong> is a tool that lets you simulate a real HTTP request to your Express app — like a robot that pedals the bike for you and checks if it moves forward.</p>
    <p>You write a test that says: "Send a GET request to <code>/api/users</code>. Expect a 200 status and an array of users." Supertest does exactly that — it sends the request and checks the response, just like a real browser would.</p>
  `,
  'td-3': `
    <p>Deploying an Express app is like <strong>moving out of your parents' house</strong>.</p>
    <p>Your development computer is your <strong>childhood bedroom</strong> — comfortable, safe, everything set up just for you. But the world can't visit you there!</p>
    <p><strong>Production</strong> is your <strong>own apartment</strong> — it's on the internet (a real street address) and anyone can visit. Services like <strong>Render, Railway, Fly.io, or Vercel</strong> provide apartments for your code.</p>
    <p>When you move out, you need a few things:</p>
    <ul>
      <li><strong>Environment variables</strong> — Like a key box outside your door. Database passwords, API keys — things that change between your bedroom and your apartment.</li>
      <li><strong>The right door number</strong> — Your app should listen on <code>process.env.PORT</code> (whatever the apartment building assigns), not a hard-coded <code>3000</code>.</li>
      <li><strong>A start command</strong> — <code>npm start</code> or <code>node app.js</code> — like giving movers the right instructions on where to put the furniture.</li>
    </ul>
  `,

  // ─── Module 9: Capstone ───
  'cp-1': `
    <p>Building a full Express API is like <strong>building a treehouse</strong> — you need a plan before you start hammering!</p>
    <p><strong>Step 1: Get your tools ready</strong> — Create your project folder, run <code>npm init</code>, install Express and any other packages you'll need. This is like gathering wood, nails, and a hammer.</p>
    <p><strong>Step 2: Draw the blueprint</strong> — Plan your routes. What endpoints do you need? <code>GET /api/items</code>, <code>POST /api/items</code>, <code>DELETE /api/items/:id</code>? Sketch it out on paper first!</p>
    <p><strong>Step 3: Organize your workspace</strong> — Create folders: <code>routes/</code>, <code>controllers/</code>, <code>models/</code>, <code>middleware/</code>. Like having separate toolboxes for screws, nails, and paint.</p>
    <p>A good plan saves hours of fixing mistakes later. <strong>Measure twice, cut once!</strong></p>
  `,
  'cp-2': `
    <p>Now it's time to <strong>build your treehouse</strong> — nail by nail!</p>
    <p><strong>Start with the floor (models)</strong> — Define your data structure with Mongoose. What fields does an Item have? Name? Price? Category? This is like laying the platform of your treehouse.</p>
    <p><strong>Build the walls (routes + controllers)</strong> — Wire up your endpoints. Each route handler is a wall that does something specific. The controller functions are the <strong>instructions</strong> for what happens when someone knocks on each wall.</p>
    <p><strong>Add the roof (middleware)</strong> — Validation, authentication, error handling. This protects your treehouse from rain (bad data) and intruders (unauthenticated users).</p>
    <p><strong>Add the ladder (tests)</strong> — Before declaring it done, test every endpoint. Does <code>POST /api/items</code> actually create an item? Does <code>DELETE</code> work? Test it like you're the first kid climbing up!</p>
    <p>Build incrementally — one piece at a time — and test as you go!</p>
  `,
  'cp-3': `
    <p>The final step is like <strong>inviting your friends over to see the treehouse</strong>!</p>
    <p><strong>Test everything one more time</strong> — Run your full test suite. Check edge cases: What happens if someone sends an empty name? What if they try to delete something that doesn't exist?</p>
    <p><strong>Polish the details</strong> — Add proper error messages, log important events, make sure your API responses follow a consistent format (<code>{ success: true, data: ... }</code> or similar).</p>
    <p><strong>Deploy!</strong> — Push your code to GitHub, connect it to Render or Railway, set your environment variables, and your API is LIVE on the internet! Anyone in the world can make requests to it!</p>
    <p><strong>Congratulations!</strong> You've built a complete Express API from scratch. You now understand:</p>
    <ul>
      <li>Routing and middleware</li>
      <li>CRUD operations</li>
      <li>Validation and error handling</li>
      <li>Authentication and databases</li>
      <li>Testing and deployment</li>
    </ul>
    <p>You're no longer a beginner — you're an <strong>Express.js developer</strong>! 🎉</p>
  `,
};

/* Expose globally for script-tag usage */
window.eli5ExpressData = eli5ExpressData;
