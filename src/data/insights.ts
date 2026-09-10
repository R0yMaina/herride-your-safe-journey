/**
 * The Forgetech Brief — technical explainers, written the way we'd explain
 * them to a client. Publication dates are content metadata and are the one
 * thing here you'll want to set to real dates before launch.
 */
export type InsightCategory =
  "AI" | "Development" | "Business Technology" | "Startups" | "Web Development" | "Automation";

export const INSIGHT_CATEGORIES: readonly InsightCategory[] = [
  "AI",
  "Development",
  "Business Technology",
  "Startups",
  "Web Development",
  "Automation",
];

export interface ArticleBlock {
  readonly heading?: string;
  readonly text: string;
}

export interface Insight {
  readonly slug: string;
  readonly title: string;
  readonly category: InsightCategory;
  readonly excerpt: string;
  readonly date: string; // ISO
  readonly featured?: boolean;
  readonly body: readonly ArticleBlock[];
}

/** Reading time from the article body — measured, not guessed at. */
export const readingTime = (article: Insight): number => {
  const words = article.body.reduce(
    (total, block) => total + block.text.trim().split(/\s+/).length,
    0,
  );
  return Math.max(1, Math.round(words / 200));
};

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export const INSIGHTS: readonly Insight[] = [
  {
    slug: "why-some-websites-feel-faster",
    title: "Why Some Websites Feel Faster Than Others",
    category: "Web Development",
    date: "2026-08-24",
    featured: true,
    excerpt:
      "Speed is not one number. It is a sequence of moments, and users only judge three of them.",
    body: [
      {
        text: "Two sites can load in the same number of seconds and feel completely different. The one that feels fast is not doing less work — it is doing the work in an order that matches what the visitor is waiting for.",
      },
      {
        heading: "The first paint is a promise",
        text: "The moment something appears on screen, the visitor stops asking whether the site is broken. That is why a page that shows its heading and layout in 800ms and fills in the rest over the next second feels faster than a page that shows nothing for 1.4 seconds and then appears complete. Same total time, different experience.",
      },
      {
        heading: "Layout shift is the tax on being late",
        text: "If an image, banner or font arrives after the text has already been placed, everything jumps. The visitor loses their line, or taps the wrong thing. Reserving space for anything that will arrive later costs nothing and removes the single most irritating thing a slow page does.",
      },
      {
        heading: "Interactivity is separate from appearance",
        text: "A page can look finished and still ignore taps, because the browser is busy running JavaScript. This is the failure mode of sites built as one large application when they only needed a page. The less JavaScript sits between the visitor and the content, the smaller the gap between looking ready and being ready.",
      },
      {
        heading: "What actually moves the needle",
        text: "Compress and correctly size images. Load fonts so text is readable while they arrive rather than after. Split code so a visitor downloads the page they asked for, not the whole site. Serve from somewhere near the visitor. None of this is exotic — it is just deliberate.",
      },
    ],
  },
  {
    slug: "seo-vs-geo-vs-aeo",
    title: "SEO vs GEO vs AEO",
    category: "Business Technology",
    date: "2026-08-11",
    excerpt:
      "Three acronyms, one question: when someone is looking for what you do, does your business appear?",
    body: [
      {
        text: "Search has stopped being a single list of blue links. People now find businesses through a search engine, through an AI assistant that answers instead of linking, and through the answer box that sits above everything. Three routes, three sets of rules.",
      },
      {
        heading: "SEO — being findable in search results",
        text: "The traditional discipline: pages that load fast, describe themselves accurately, are structured with real headings, and are linked to from elsewhere. It still carries most discovery for most businesses.",
      },
      {
        heading: "AEO — being the answer",
        text: "Answer Engine Optimisation is about being the source that a featured snippet or voice assistant reads out. That rewards content that answers a specific question directly and early, rather than burying the answer under six paragraphs of preamble.",
      },
      {
        heading: "GEO — being cited by AI",
        text: "Generative Engine Optimisation is the newest of the three: appearing inside what an AI assistant tells someone. Assistants favour content that states facts plainly, is internally consistent, and is structured clearly enough to quote. Marketing language that says nothing specific is invisible to them.",
      },
      {
        heading: "The overlap is the strategy",
        text: "Fortunately these do not pull in different directions. Clear structure, honest specifics, fast pages and accurate metadata serve all three. The businesses that lose are the ones whose site says a great deal without stating anything a machine — or a customer — can act on.",
      },
    ],
  },
  {
    slug: "how-payment-integrations-work",
    title: "How Payment Integrations Actually Work",
    category: "Development",
    date: "2026-07-29",
    excerpt:
      "Your server never sees the card, and the payment is never confirmed by the browser. Here's why both matter.",
    body: [
      {
        text: "A payment looks like one button. Underneath it is a conversation between four parties: the customer, your application, the payment provider, and the bank or mobile money network holding the funds.",
      },
      {
        heading: "Your server should not touch the card",
        text: "In a correctly built integration the card details go from the customer's browser straight to the payment provider, which returns a token. Your application handles the token, never the number. This is not only good practice — it is what keeps you out of the compliance regime that handling card data directly would put you into.",
      },
      {
        heading: "Intent first, confirmation later",
        text: "The typical flow creates a payment intent on your server for a specific amount, hands it to the client to authorise, and then waits. Authorisation may involve a 3-D Secure challenge, a bank app, or an M-Pesa prompt on the customer's phone. None of that happens in your page.",
      },
      {
        heading: "The webhook is the source of truth",
        text: "This is the part that gets built wrong most often: the browser returning to a success page does not mean the money moved. The customer may close the tab, lose signal, or authorise on another device. The provider's webhook — a server-to-server callback — is what tells you the payment succeeded. Fulfil the order there, verify the signature, and make the handler idempotent, because webhooks are retried and can arrive twice.",
      },
      {
        heading: "Design for the states that are not success",
        text: "Pending, failed, cancelled, refunded, and partially refunded are all real. An integration that only handles success will strand real customers and real money.",
      },
    ],
  },
  {
    slug: "what-happens-when-you-type-a-url",
    title: "What Happens When You Type a Website URL?",
    category: "Development",
    date: "2026-07-15",
    excerpt: "The half-second between pressing enter and seeing a page, unpacked.",
    body: [
      {
        text: "It is the oldest interview question in web development, and it is still the best map of how the web fits together.",
      },
      {
        heading: "1. The name becomes an address",
        text: "Domain names exist for people; the network routes by IP address. Your device asks a DNS resolver where forgetech.ke lives, and — usually from a cache — gets an address back.",
      },
      {
        heading: "2. A connection is opened and secured",
        text: "The browser opens a TCP connection to that address, then performs a TLS handshake: the server presents a certificate, both sides agree on keys, and everything after that point is encrypted. This is the padlock.",
      },
      {
        heading: "3. The request is sent",
        text: "The browser sends an HTTP request — the path, the method, cookies, and what content types it can accept. Somewhere a server, or a CDN edge node standing in for it, decides what to send back.",
      },
      {
        heading: "4. The page is built",
        text: "HTML arrives first. As the browser parses it, it discovers stylesheets, scripts, images and fonts, and requests those too. It builds the document tree, applies styles, calculates layout, and paints. Scripts can block this, which is why where they sit matters.",
      },
      {
        heading: "Why it is worth knowing",
        text: "Almost every performance problem is one of these steps taking too long, and almost every security question is about which step you are trusting.",
      },
    ],
  },
  {
    slug: "how-login-systems-work",
    title: "How Login Systems Actually Work",
    category: "Development",
    date: "2026-06-30",
    excerpt: "Passwords are never stored. What is stored, and what proves who you are afterwards.",
    body: [
      {
        text: "Authentication answers one question — are you who you claim to be — and then a second, quieter one: how do we keep knowing that on every request afterwards.",
      },
      {
        heading: "Passwords are hashed, not stored",
        text: "A correctly built system never stores your password. It stores the output of a slow, salted hashing function such as bcrypt or argon2. At login it hashes what you typed and compares. Slowness is the feature: it makes guessing millions of passwords expensive. If a service can email you your existing password, it is storing it, and that is a serious defect.",
      },
      {
        heading: "Proving it once is not enough",
        text: "HTTP does not remember you between requests. After a successful login the server issues something the browser sends back each time — a session cookie or a token — which is why the second half of authentication is really about what that credential is and how it can be revoked.",
      },
      {
        heading: "The parts people skip",
        text: "Rate limiting on login attempts. Expiry on password reset links, and single use. Not revealing whether an email exists in your error messages. A second factor for anything privileged. These are not extras; they are most of the actual security.",
      },
      {
        heading: "Authorisation is a separate problem",
        text: "Knowing who someone is says nothing about what they may do. Permissions belong in the layer that owns the data — enforced on the server, never in the interface, which any user can bypass.",
      },
    ],
  },
  {
    slug: "cookies-vs-sessions-vs-jwt",
    title: "Cookies vs Sessions vs JWT",
    category: "Development",
    date: "2026-06-17",
    excerpt: "Three things that get used interchangeably and are not the same thing at all.",
    body: [
      {
        text: "These three terms appear in the same sentence constantly, which hides the fact that they answer different questions. A cookie is a transport. A session is a server-side record. A JWT is a self-describing token.",
      },
      {
        heading: "The cookie is only the envelope",
        text: "A cookie is a small value the browser stores for a domain and sends automatically with every request to it. It says nothing about what is inside. A session ID and a JWT can both travel in one.",
      },
      {
        heading: "Sessions: the server remembers",
        text: "The server creates a record, gives the browser a meaningless ID that points to it, and looks it up on each request. Because the record lives on the server, you can revoke it instantly — log out one device, ban an account, force everyone out. The cost is that every request needs that lookup, and the store has to be shared across servers.",
      },
      {
        heading: "JWTs: the token remembers",
        text: "A JSON Web Token carries its own claims — who the user is, what they may do, when it expires — signed so it cannot be altered. The server verifies the signature and needs no lookup at all, which is why it suits APIs and services that do not share a database. The trade-off is the mirror image of sessions: a valid token stays valid until it expires. You cannot un-issue it.",
      },
      {
        heading: "How this is usually resolved",
        text: "Short-lived access tokens plus a long-lived refresh token that can be revoked. You get the statelessness for most requests and a real revocation point for the moment it matters. Store them in httpOnly cookies rather than local storage, which any script on the page can read.",
      },
    ],
  },
  {
    slug: "what-is-a-cdn",
    title: "What Is a CDN?",
    category: "Web Development",
    date: "2026-06-03",
    excerpt: "Distance is latency. A CDN's whole job is to make your site closer.",
    body: [
      {
        text: "If your server is in Frankfurt and your customer is in Nairobi, every request makes a round trip of thousands of kilometres. Nothing in your code can make light faster. A content delivery network solves this by not making the trip.",
      },
      {
        heading: "Copies, close to people",
        text: "A CDN is a network of servers in many locations. A copy of your images, stylesheets, scripts — and increasingly your pages — is cached at the location nearest the visitor and served from there. The first visitor in a region pays the long trip; everyone after them does not.",
      },
      {
        heading: "Cache control is the whole skill",
        text: "The difficulty is not caching, it is invalidating. Assets that never change should be cached for a year and given a new filename when they change. Pages that change should carry short cache lifetimes or explicit invalidation. Getting this wrong is why people see a stale site after a deploy.",
      },
      {
        heading: "It is also a shield",
        text: "Because a CDN sits in front of your origin, it absorbs traffic spikes and hostile traffic before either reaches your server, and it terminates TLS at the edge. For most sites this matters as much as the speed.",
      },
      {
        heading: "Where it matters most",
        text: "In markets with slower average connections and longer routes to major data centres, a CDN is not an optimisation — it is often the difference between a site that is usable and one that is abandoned.",
      },
    ],
  },
  {
    slug: "how-websites-handle-millions-of-visitors",
    title: "How Websites Handle Millions of Visitors",
    category: "Development",
    date: "2026-05-20",
    excerpt: "Scaling is mostly the art of doing less work per request.",
    body: [
      {
        text: "Handling scale is rarely about one enormous machine. It is about removing work, spreading what remains, and making sure one slow component cannot take everything down with it.",
      },
      {
        heading: "Do the work once",
        text: "The cheapest request is one that never reaches your application. Caching — at the edge, in front of the database, inside the application — is the first and largest win, and often the only one a growing site needs.",
      },
      {
        heading: "Spread the rest",
        text: "A load balancer sits in front of several identical application servers. That only works if your servers keep no state of their own, which is why sessions, uploads and queues live in shared services rather than on disk.",
      },
      {
        heading: "The database is usually the ceiling",
        text: "Application servers are easy to add; databases are not. Read replicas, connection pooling, and indexes matched to the queries you actually run take you a long way. Most 'we need to scale' problems are one missing index.",
      },
      {
        heading: "Move slow work out of the request",
        text: "Emails, image processing, reports and third-party calls belong in a queue processed by workers, not in the request the user is waiting on.",
      },
      {
        heading: "Assume things will fail",
        text: "At scale something is always degraded. Timeouts, retries with backoff, and graceful degradation are what separate a slow site from an outage.",
      },
    ],
  },
  {
    slug: "ai-coding-vs-understanding-code",
    title: "AI Coding vs Understanding Code",
    category: "AI",
    date: "2026-05-06",
    excerpt: "Generating code has become easy. Being responsible for it has not.",
    body: [
      {
        text: "AI tools now write working code quickly, and that is genuinely useful. It also moves the bottleneck: the hard part was never typing. It was deciding what should exist, and being able to tell whether what you have is correct.",
      },
      {
        heading: "Plausible is not the same as correct",
        text: "A generated function can be well-structured, well-named and confidently wrong — off by one, missing a case, or subtly insecure. It will not look wrong. Only someone who understands the problem can tell.",
      },
      {
        heading: "The questions AI cannot answer for you",
        text: "Should this data be exposed to this user? What happens when this third party is down? Is this the right abstraction for where the product is going in a year? These are judgement calls about a specific business, and they are where most of the real value in engineering sits.",
      },
      {
        heading: "How we use it",
        text: "As leverage on work we could do ourselves and can therefore review: scaffolding, refactors, tests, boilerplate. Not as a substitute for understanding the system we are responsible for. Every line still has to be read, and the architecture is still a human decision.",
      },
      {
        heading: "The advice for people learning",
        text: "Use the tools, but do not skip the phase where you struggle. The struggle is what builds the judgement that makes the tools safe to use.",
      },
    ],
  },
  {
    slug: "backend-roadmap-for-beginners",
    title: "Backend Roadmaps for Beginners",
    category: "Startups",
    date: "2026-04-22",
    excerpt: "A short, honest order to learn things in — and what to ignore for now.",
    body: [
      {
        text: "Most backend roadmaps are a wall of logos. Here is a shorter one, ordered by what actually unblocks the next thing.",
      },
      {
        heading: "1. One language, properly",
        text: "Pick one — JavaScript with Node.js is a reasonable default because it shares a language with the frontend — and learn it well enough to debug it. Breadth is worth nothing without depth.",
      },
      {
        heading: "2. HTTP and APIs",
        text: "Methods, status codes, headers, request and response bodies, and what makes a REST endpoint predictable. Everything you build afterwards speaks this.",
      },
      {
        heading: "3. Databases and modelling",
        text: "SQL first. Learn what a relation, an index and a transaction are, and practise modelling a real domain. Data modelling is the skill that ages best — it will still be right long after the framework you learned it in is gone.",
      },
      {
        heading: "4. Authentication and authorisation",
        text: "Hashing, sessions and tokens, and the difference between knowing who someone is and deciding what they may do.",
      },
      {
        heading: "5. Deployment",
        text: "Get something onto the internet with a domain, HTTPS and environment variables. Nothing teaches faster than having to keep something running.",
      },
      {
        heading: "What to ignore for now",
        text: "Kubernetes, microservices, message brokers and most of the rest. They solve problems you do not have yet, and you will learn them faster once you do.",
      },
    ],
  },
];

export const findInsight = (slug: string): Insight | undefined =>
  INSIGHTS.find((article) => article.slug === slug);

/** Same category first, then anything else, never the article itself. */
export const relatedInsights = (article: Insight, count = 3): readonly Insight[] => {
  const others = INSIGHTS.filter((candidate) => candidate.slug !== article.slug);
  const sameCategory = others.filter((candidate) => candidate.category === article.category);
  const rest = others.filter((candidate) => candidate.category !== article.category);
  return [...sameCategory, ...rest].slice(0, count);
};

export const featuredInsight = (): Insight => INSIGHTS.find((a) => a.featured) ?? INSIGHTS[0];
