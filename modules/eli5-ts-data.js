/**
 * ELI5 (Explain Like I'm 5) content for TypeScript Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5TsData = {
  'basic-types-1': `
    <p>Imagine you're labelling boxes in your room. Some boxes hold <strong>words</strong> (text), some hold <strong>numbers</strong>, and some hold <strong>true/false</strong> answers. TypeScript lets you tell your code which type of box each variable is.</p>
    <ul>
      <li><strong>string</strong> = a word or sentence, like <code>"Hello"</code></li>
      <li><strong>number</strong> = any number, like <code>25</code> or <code>3.14</code></li>
      <li><strong>boolean</strong> = yes or no, like <code>true</code> or <code>false</code></li>
    </ul>
    <p>You write the type after a colon, like <code>let name: string = "Alice"</code>. It's like putting a label on a box so you (and your computer) always know what's inside!</p>
    <p>There's also a type called <strong>any</strong> — it's like a box with no label at all. You <em>can</em> put anything in it, but it's easy to make mistakes. Try to use it only when you really have to!</p>
  `,
  'basic-types-2': `
    <p>You know when you put a toy in a box, and later you can see what's inside without the label because you remember putting it there? <strong>Type inference</strong> is TypeScript doing exactly that!</p>
    <p>When you write <code>let x = 10</code>, TypeScript looks at the <code>10</code> and thinks: "That's a number!" So it automatically treats <code>x</code> as a number — no label needed.</p>
    <ul>
      <li>Write <code>let name = "Alice"</code> → TypeScript knows it's a <strong>string</strong></li>
      <li>Write <code>let age = 25</code> → TypeScript knows it's a <strong>number</strong></li>
      <li>Write <code>let isCool = true</code> → TypeScript knows it's a <strong>boolean</strong></li>
    </ul>
    <p>This saves you time! You only need to add a label (type annotation) when TypeScript can't figure it out on its own — like for function inputs.</p>
  `,
  'interfaces-1': `
    <p>An <strong>interface</strong> is like a <strong>blueprint</strong> for an object. If you're building a toy figure, the blueprint says: "It needs a head, two arms, and two legs." Same idea — an interface describes what properties an object should have.</p>
    <ul>
      <li><strong>Required properties</strong> — things every object <em>must</em> have, like a name</li>
      <li><strong>Optional properties</strong> (marked with <code>?</code>) — nice-to-haves, like a nickname</li>
      <li><strong>Readonly properties</strong> — things you can set once but never change, like an ID number</li>
    </ul>
    <p>Think of it like a school form: "Name (required), Email (required), Phone (optional)." The interface makes sure every student fills out the form correctly!</p>
    <p>Interfaces are <strong>open</strong> — you can add to them later. It's like adding extra questions to the form without starting over.</p>
  `,
  'interfaces-2': `
    <p><strong>Type aliases</strong> (using <code>type</code>) and <strong>interfaces</strong> are two ways to describe the shape of your data. They're like two flavours of ice cream — similar but with different strengths.</p>
    <ul>
      <li><strong>Interface</strong> is like a <strong>stamp</strong>: you keep the original and can make new stamps from it (extends) or add to it later (declaration merging)</li>
      <li><strong>Type alias</strong> is like a <strong>nickname</strong>: you give a name to something already existing. Great for unions like <code>string | number</code></li>
    </ul>
    <p>When do you use which?</p>
    <ul>
      <li>Use <strong>interface</strong> for describing objects that other people will build upon (like public APIs)</li>
      <li>Use <strong>type</strong> when you need unions (<code>this | that</code>), intersections (<code>this & that</code>), or tuples (fixed-length arrays)</li>
    </ul>
    <p>Both can use generics, both can describe objects — they're just two tools for similar jobs!</p>
  `,
  'generics-1': `
    <p>Generics are like <strong>adjustable tools</strong> — like a wrench that can fit any size of bolt.</p>
    <p>Imagine you want a function that returns the first item of a list. Without generics, you'd need one function for numbers, another for strings, another for... everything! With generics, you write <strong>one</strong> function that works with <strong>any</strong> type:</p>
    <ul>
      <li><code>function first&lt;T&gt;(arr: T[]): T</code> — the <code>T</code> is a placeholder. When you call it with numbers, <code>T</code> becomes <code>number</code>. With strings, <code>T</code> becomes <code>string</code>.</li>
    </ul>
    <p>You can also <strong>constrain</strong> generics with <code>extends</code>. That's like saying: "This tool works with any bolt that has a hexagonal head." It limits what you can use but gives you superpowers with what fits!</p>
  `,
  'generics-2': `
    <p>TypeScript has built-in <strong>utility types</strong> — they're like <strong>power tools</strong> for transforming types. Instead of writing everything from scratch, you just use the right tool for the job!</p>
    <ul>
      <li><strong>Partial&lt;T&gt;</strong> — makes everything optional. Like turning a "must fill all fields" form into an "only fill what you want" form</li>
      <li><strong>Required&lt;T&gt;</strong> — makes everything required. The opposite!</li>
      <li><strong>Pick&lt;T, K&gt;</strong> — picks only the properties you want. Like choosing only 3 toppings from a pizza menu</li>
      <li><strong>Omit&lt;T, K&gt;</strong> — removes properties you don't want. Like getting a burger without onions</li>
      <li><strong>Record&lt;K, T&gt;</strong> — creates a map of keys to values. Like a phonebook where names (keys) map to numbers (values)</li>
      <li><strong>Readonly&lt;T&gt;</strong> — makes everything read-only. Like a printed document you can't edit, only read</li>
    </ul>
    <p>These save you from writing the same boring type definitions over and over!</p>
  `,
  'enums-1': `
    <p>An <strong>enum</strong> is like a <strong>menu of choices</strong>. Instead of remembering that 0 = North, 1 = East, 2 = South, 3 = West, you just write <code>Direction.North</code> and TypeScript handles the numbers.</p>
    <ul>
      <li><strong>Numeric enums</strong> — like numbered parking spots. <code>enum Direction { North, East, South, West }</code> → North is 0, East is 1, etc.</li>
      <li><strong>String enums</strong> — like names instead of numbers. <code>enum Status { Active = "ACTIVE", Inactive = "INACTIVE" }</code></li>
    </ul>
    <p>Why use enums? Imagine a traffic light — you could remember 0 = Red, 1 = Yellow, 2 = Green. But <code>TrafficLight.Red</code> is <strong>much</strong> easier to read and less error-prone!</p>
    <p>For extra speed, use <strong>const enum</strong> — it's like your brain replacing "TrafficLight.Red" with just "0" without thinking about it. No extra code generated!</p>
  `,
  'unions-1': `
    <p>Life is full of "either/or" situations. You can have <strong>coffee OR tea</strong>. In TypeScript, that's a <strong>union type</strong> (<code>|</code>).</p>
    <ul>
      <li><strong>Union</strong> (<code>string | number</code>) — "This can be a word OR a number." Like an ID that could be <code>"user-123"</code> or just <code>123</code></li>
      <li><strong>Intersection</strong> (<code>&</code>) — "This must be BOTH." Like a person who has a name AND an email</li>
      <li><strong>Discriminated union</strong> — a special union where each option has a unique label (the "discriminant"). Like different shapes: each has a <code>kind</code> property that says "circle", "square", or "triangle"</li>
    </ul>
    <p>The cool part: TypeScript can <strong>narrow down</strong> which type you're working with. If you check <code>typeof value === "string"</code>, TypeScript knows inside that block it's definitely a string!</p>
  `,
  'classes-1': `
    <p>Think of a <strong>class</strong> as a <strong>cookie cutter</strong> and objects as the actual cookies you bake. The class defines the shape, and each object is one copy you can use.</p>
    <p>TypeScript supercharges classes with extra safety features:</p>
    <ul>
      <li><strong>public</strong> — anyone can access this (like a storefront window)</li>
      <li><strong>private</strong> — only the class itself can access this (like a secret diary)</li>
      <li><strong>protected</strong> — the class and its children can access this (like a family recipe)</li>
    </ul>
    <p><strong>Parameter properties</strong> are a neat shortcut. Instead of writing the property name four times, you just add <code>public</code>, <code>private</code>, or <code>protected</code> right in the constructor. One line does the work of three!</p>
    <p><strong>Abstract classes</strong> are like templates for other classes. You can't use them directly — they're like a coloring book outline that other classes fill in with actual colors.</p>
  `,
  'decorators-1': `
    <p><strong>Decorators</strong> are like <strong>stickers</strong> you put on your code. A sticker doesn't change what the code fundamentally is, but it adds extra information or behaviour!</p>
    <ul>
      <li><strong>Class decorator</strong> — a sticker on the whole cookie jar. It can seal it or lock it</li>
      <li><strong>Method decorator</strong> — a sticker on a specific action. It can log when it's called or check permissions first</li>
      <li><strong>Property decorator</strong> — a sticker on a specific ingredient. It can validate values or track changes</li>
    </ul>
    <p>Real-world example: In Angular or NestJS, decorators are everywhere. <code>@Component()</code> is like putting a "This is a web page component!" sticker on a class. <code>@Injectable()</code> says "This service can be shared across the app."</p>
    <p>Think of it like adding a "FRAGILE" sticker to a package — the package is still a box, but now people know to handle it carefully!</p>
  `,
  'modules-1': `
    <p>A <strong>module</strong> is simply a file. Every file is like a separate room in a house. The <code>export</code> keyword is like a door — it lets things out. The <code>import</code> keyword is like entering through that door — it brings things in.</p>
    <ul>
      <li><strong>Named exports</strong> — like multiple labelled doors: "Calculator", "Formatter", "Logger"</li>
      <li><strong>Default export</strong> — like the main front door of the house</li>
      <li><strong>Re-exports</strong> (<code>export * from</code>) — like having a hallway that connects to other rooms, letting you pass through</li>
    </ul>
    <p>TypeScript has a special <code>import type</code> — it's like saying "I only want to look at the blueprint, not the actual furniture." This gets erased when the code runs, keeping your bundles small!</p>
    <p><strong>Barrel files</strong> (<code>index.ts</code>): Think of an index at the front of a book. It lists all chapters in one place so you can find them easily.</p>
  `,
  'namespaces-1': `
    <p><strong>Namespaces</strong> are like <strong>folders on your computer</strong>. You put related files together inside a folder so they don't get mixed up with other files.</p>
    <p>In TypeScript, a namespace groups related code using the <code>namespace</code> keyword. Everything inside lives in that namespace, so it won't accidentally clash with similarly-named things outside.</p>
    <ul>
      <li><strong>Nested namespaces</strong> — like folders inside folders. <code>Validation.Helpers</code> means "the Helpers folder inside the Validation folder"</li>
      <li><strong>Export</strong> — things you want to share outside the namespace, like marking files as "shared"</li>
    </ul>
    <p>However, for most modern projects, prefer <strong>ES modules</strong> (separate files with import/export). Namespaces are mostly used for legacy code and type definitions (<code>.d.ts</code> files). They're like a filing cabinet — still useful, but cloud storage (ES modules) is usually better!</p>
  `,
  'type-guards-1': `
    <p>A <strong>type guard</strong> is like a <strong>security checkpoint</strong>. You have a bag (variable) that could contain different things. The guard checks what's inside and says: "Okay, this is definitely a phone, you can use its screen."</p>
    <p>TypeScript has built-in checkpoints:</p>
    <ul>
      <li><strong>typeof</strong> — "Is this a string? A number? A boolean?"</li>
      <li><strong>instanceof</strong> — "Is this a Dog object or a Cat object?"</li>
      <li><strong>Array.isArray()</strong> — "Is this a list?"</li>
      <li><strong>in</strong> — "Does this object have a 'fly' property?"</li>
    </ul>
    <p>You can also build <strong>custom type guards</strong> using <strong>type predicates</strong> (<code>value is Type</code>). It's like training your own security guard to recognise specific items. Once the guard approves, TypeScript knows exactly what type you're working with!</p>
    <p>This makes your code safer because TypeScript automatically removes impossible options after a check. Like a detective narrowing down suspects!</p>
  `,
  'advanced-1': `
    <p><strong>Mapped types</strong> are like taking a form and <strong>transforming every field</strong> at once. Imagine you have a sign-up form and you want to make every field optional — instead of rewriting the whole form, a mapped type does it automatically!</p>
    <ul>
      <li><strong>Mapped types</strong> loop over each property and change it: "Make all properties optional" or "Make all properties read-only"</li>
      <li><strong>Conditional types</strong> ask a question: "Is this type a string? Give me 'yes', otherwise give me 'no'" — like a choose-your-own-adventure book!</li>
      <li><strong>Template literal types</strong> (TS 4.1+) let you build types from string patterns. Like saying "any string that starts with <code>on</code> followed by a capital letter" — perfect for event names!</li>
    </ul>
    <p>These might sound fancy, but they're just smart shortcuts. Instead of writing 10 similar types by hand, you write <strong>one</strong> mapped type that creates all 10 automatically!</p>
  `,
  'real-world-1': `
    <p>Let's put everything together! We're building a <strong>type-safe API client</strong> — a helper that talks to a server and makes sure the data is correct.</p>
    <p>Think of it like ordering food delivery:</p>
    <ul>
      <li>You (the code) tell the API client what you want: "Get me a list of products"</li>
      <li>The API client goes to the server (restaurant) and brings back the data (food)</li>
      <li>TypeScript checks that what you got back actually matches what you expected — like checking your delivery receipt</li>
    </ul>
    <p>Key ingredients we use from previous lessons:</p>
    <ul>
      <li><strong>Generics</strong> — the client works with any type of data (products, users, orders)</li>
      <li><strong>Discriminated unions</strong> — success always has <code>data</code>, failure always has <code>error</code>. No mixing them up!</li>
      <li><strong>Type guards</strong> — <code>isSuccess()</code> checks if the response succeeded</li>
      <li><strong>Utility types</strong> — for flexible configurations</li>
    </ul>
    <p>This is how real companies build their APIs — combining TypeScript features to catch bugs before they reach users!</p>
  `,
};

/* Expose globally for script-tag usage */
window.eli5TsData = eli5TsData;
