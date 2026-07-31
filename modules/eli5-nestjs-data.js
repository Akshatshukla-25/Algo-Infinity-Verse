/**
 * ELI5 (Explain Like I'm 5) content for NestJS Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

var eli5NestjsData = {
  // ─── Module 1: NestJS Architecture Basics ───
  'arch-1': `
    <p>NestJS is like a <strong>well-organized kitchen</strong> in a restaurant. Everything has a designated place — the stove does the cooking, the fridge stores ingredients, and the sink handles cleaning. NestJS does the same for your backend code: it keeps things separated, organized, and easy to manage.</p>
    <p>It's built on top of <strong>TypeScript</strong>, which is like JavaScript wearing a safety helmet — it catches mistakes before they happen.</p>
    <p>The <strong>AppModule</strong> is the <em>head chef</em> who coordinates everything. It knows which tools (controllers, services) exist and how they connect. Every NestJS app starts with this one main module, and it branches out from there like a family tree.</p>
    <p>Under the hood, NestJS uses servers like <strong>Express</strong> or <strong>Fastify</strong> — think of them as the kitchen appliances that actually do the work, while NestJS is the chef's recipe book telling them what to do.</p>
  `,

  // ─── Module 2: Controllers & Routing ───
  'controllers-1': `
    <p>A <strong>Controller</strong> is like a <strong>receptionist at a hotel</strong>. When a guest (HTTP request) arrives, the receptionist decides which room (handler method) to send them to based on what they need.</p>
    <p>You give your controller a prefix like <code>@Controller('users')</code> — that's like putting a sign on the door saying "User Services Desk." Any request starting with <code>/users</code> comes to this desk.</p>
    <p>Then you create little doors inside: <code>@Get()</code> handles "show me all users," <code>@Post()</code> handles "create a new user," and so on. Each door leads to a specific action.</p>
    <p>When data comes in (like a form submission), you use <code>@Body()</code> to grab it — like picking up a letter from the mail slot. When you need a specific ID from the URL, you use <code>@Param()</code> — like reading the room number off a key.</p>
  `,

  // ─── Module 3: Services & Providers ───
  'providers-1': `
    <p>A <strong>Service</strong> is like a <strong>specialist worker</strong> — a chef, a mechanic, a doctor. They do the actual heavy lifting while the controller just directs traffic.</p>
    <p>In NestJS, almost everything is a <strong>Provider</strong> — services, factories, helpers. Providers are managed by NestJS's <strong>Dependency Injection</strong> system, which is like a smart vending machine.</p>
    <p>Instead of a controller going out to build its own tools, it just tells the vending machine: "I need a TasksService, please." The vending machine already has one ready and hands it over. That's dependency injection!</p>
    <p>You mark a service with <code>@Injectable()</code> — that's like putting a label on it that says "I'm ready to be used by other classes." Without this label, NestJS doesn't know the service exists.</p>
    <p>The beauty? Your controller doesn't need to know HOW the service works — it just knows it CAN work. You can swap the service for a different implementation later, and the controller won't even notice!</p>
  `,

  // ─── Module 4: Modules & Dynamic Modules ───
  'modules-1': `
    <p>Think of modules like <strong>departments in a company</strong>. The Sales department has its own people, tools, and processes. The Engineering department has its own too. Each department is self-contained.</p>
    <p>In NestJS, a <strong>Module</strong> groups related pieces together — controllers, services, and other helpers that work on the same feature. The <code>UsersModule</code> might contain the UsersController and UsersService.</p>
    <p>By default, what happens inside a module stays inside that module — like department walls. If another module needs to use your service, you have to explicitly <strong>export</strong> it. That's like opening a door between departments and saying "You can use our tools."</p>
    <p>You list shared services in the <code>exports</code> array. Other modules then <strong>import</strong> your module to get access. It's like inter-departmental collaboration — you need permission, not just a passing glance.</p>
    <p>This keeps your app clean and prevents spaghetti code where everything depends on everything else!</p>
  `,

  // ─── Module 5: Pipes & Data Validation ───
  'pipes-1': `
    <p>A <strong>Pipe</strong> is like a <strong>security guard at a building entrance</strong>. Before anyone gets in, the guard checks their ID, makes sure they're on the guest list, and transforms their visitor badge into a proper access card.</p>
    <p>Pipes do two things: <strong>transform</strong> data (like turning a string <code>"123"</code> into the number <code>123</code>) and <strong>validate</strong> data (making sure an email actually looks like an email).</p>
    <p>A <strong>DTO</strong> (Data Transfer Object) is like a <strong>blueprint for a form</strong>. It says "this form must have a title (text) and a description (text)." If someone submits a form missing the title, the ValidationPipe catches it and sends back an error before your code even runs.</p>
    <p>You put <code>@UsePipes(new ValidationPipe())</code> on your controller — like telling the security guard "check everyone who comes to my office." It's automatic protection without you writing if-checks everywhere!</p>
  `,

  // ─── Module 6: Guards & Authentication ───
  'guards-1': `
    <p>A <strong>Guard</strong> is like a <strong>bouncer at a nightclub</strong>. Before you can enter, the bouncer checks: "Do you have a valid ID? Are you on the list?" If yes, you go in. If no, you're turned away.</p>
    <p>Guards decide whether a request is <strong>allowed</strong> to reach the route handler. They're perfect for authentication (who are you?) and authorization (are you allowed here?).</p>
    <p>You create a guard by implementing the <code>CanActivate</code> interface — it's like giving the bouncer a checklist. The guard returns <code>true</code> (let them in) or <code>false</code> (block them).</p>
    <p>When you add <code>@UseGuards(AuthGuard)</code> to a controller, it's like saying "every visitor to this office must pass the bouncer first." The guard checks the request's authorization header, and if it doesn't match, the request gets a 403 Forbidden response — like being turned away at the door!</p>
  `,

  // ─── Module 7: Interceptors & Logging ───
  'interceptors-1': `
    <p>An <strong>Interceptor</strong> is like a <strong>photo booth</strong>. Someone walks in, something happens inside (a photo is taken), and then they walk out — but now they have a photo!</p>
    <p>Interceptors wrap around your route handlers and can do things <strong>before</strong> and <strong>after</strong> the request is processed. Think of them as invisible assistants that add extra features without cluttering your main code.</p>
    <p>Want to log how long every request takes? Add a logging interceptor. Want to cache responses? Add a caching interceptor. Want to transform the response format? Add a mapping interceptor.</p>
    <p>Interceptors use <strong>RxJS Observables</strong> — don't worry, just think of them as <em>streams of data</em> that flow through pipes. The interceptor taps into the stream, watches what flows through, and can modify or record it along the way.</p>
    <p>It's like having a security camera that not only watches but also stamps a timestamp on every request!</p>
  `,

  // ─── Module 8: Exception Filters & Error Handling ───
  'exceptions-1': `
    <p>An <strong>Exception Filter</strong> is like an <strong>insurance claims handler</strong>. When something goes wrong (a car accident, a broken pipe), instead of panicking, you call the handler. They know exactly what paperwork to fill out, what to tell you, and how to file it properly.</p>
    <p>In NestJS, when your code throws an error, the built-in Exceptions Layer catches it and turns it into a proper HTTP response. If you throw <code>NotFoundException</code>, the client gets a <code>404</code>. If you throw <code>BadRequestException</code>, they get a <code>400</code>. You don't have to manually write <code>res.status(404).send(...)</code> everywhere.</p>
    <p>But what if you want to customize how errors look? That's where custom Exception Filters come in. You create a class that catches errors and formats them however you want — adding timestamps, logging to a file, or returning a friendlier error message. It's like having your own personal error translator!</p>
  `,

  // ─── Module 9: Database Integration (ORM) ───
  'db-1': `
    <p>An <strong>ORM</strong> (Object-Relational Mapper) is like a <strong>universal translator</strong> at the United Nations. Your code speaks "JavaScript objects" and the database speaks "SQL tables." The ORM translates between them so you don't have to learn both languages.</p>
    <p>In NestJS, ORMs like <strong>TypeORM</strong> or <strong>Prisma</strong> let you define your data as classes (like <code>User</code> with <code>id</code> and <code>username</code>). The ORM turns that class into a database table automatically.</p>
    <p>A <strong>Repository</strong> is like a <strong>librarian for a specific book section</strong>. The User Repository knows everything about users — how to find them, save them, update them, and delete them. You don't need to write SQL queries; you just ask the librarian.</p>
    <p>The <code>@InjectRepository(User)</code> decorator tells NestJS: "Give me the librarian who handles User books." NestJS hands it to you through dependency injection — no manual setup needed!</p>
  `,

  // ─── Module 10: GraphQL Resolver APIs ───
  'graphql-1': `
    <p>In a regular REST API, you get what the server decides to give you — like ordering a set menu at a restaurant. In <strong>GraphQL</strong>, you get to say exactly what you want — like ordering à la carte: "I'll have the name, the email, but skip the address."</p>
    <p>A <strong>Resolver</strong> is like a <strong>waiter who takes your custom order</strong>. Instead of controllers with fixed routes, you define resolvers that handle specific queries and mutations.</p>
    <p><code>@Query()</code> is for <strong>reading data</strong> — like asking "give me all the books." <code>@Mutation()</code> is for <strong>changing data</strong> — like saying "add this new book to the shelf."</p>
    <p>You decorate a class with <code>@Resolver()</code>, and inside it, you define what data is available and how to fetch it. The client (like a React app) then asks for exactly the fields it needs, and GraphQL returns only those — nothing more, nothing less!</p>
    <p>It's the ultimate "ask and you shall receive" — but only what you actually asked for!</p>
  `
};
