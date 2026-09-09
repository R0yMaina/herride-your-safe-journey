/** The four things Forgetech builds. Used by the homepage cards and, in
 *  expanded form, by the Services page — one record, two depths of detail. */
export interface ServiceRecord {
  readonly id: string;
  readonly number: string;
  readonly title: string;
  readonly summary: string;
  /** What is actually delivered — the homepage card shows these. */
  readonly includes: readonly string[];
  /** Services page only. */
  readonly overview: string;
  readonly problems: readonly string[];
  readonly builds: readonly string[];
  readonly technology: readonly string[];
  readonly useCases: readonly string[];
}

export const SERVICES: readonly ServiceRecord[] = [
  {
    id: "websites",
    number: "01",
    title: "Websites",
    summary:
      "Modern, fast websites designed to establish credibility, attract customers and convert visitors.",
    includes: [
      "Business websites",
      "Landing pages",
      "E-commerce",
      "Booking platforms",
      "Web applications",
    ],
    overview:
      "A website is usually the first thing a customer meets. We design and build sites that load quickly, read clearly and give people an obvious next step — not brochures that sit still.",
    problems: [
      "Customers cannot find the business online, or find it and leave.",
      "The site looks dated next to competitors and costs the business credibility.",
      "Traffic arrives but nothing happens — no enquiries, no bookings, no sales.",
      "Content cannot be updated without going back to a developer.",
    ],
    builds: [
      "Marketing and business websites",
      "Conversion-focused landing pages",
      "E-commerce storefronts and checkout flows",
      "Booking and reservation platforms",
      "Content systems the team can edit themselves",
    ],
    technology: ["React", "Next.js", "Tailwind CSS", "Node.js", "Cloudinary", "REST APIs"],
    useCases: [
      "A service business that needs to be found and trusted",
      "A retailer moving sales online",
      "A clinic, salon or studio taking bookings",
      "A company replacing a site it has outgrown",
    ],
  },
  {
    id: "ai",
    number: "02",
    title: "AI",
    summary:
      "Intelligent technology that helps businesses automate decisions, workflows and customer interactions.",
    includes: [
      "AI assistants",
      "AI integrations",
      "AI-powered workflows",
      "Intelligent business tools",
    ],
    overview:
      "AI is only useful when it is pointed at a specific job. We start from the decision or conversation that costs the business time, then build the narrowest system that handles it reliably — with a human in the loop where the stakes require one.",
    problems: [
      "The same customer questions are answered manually, all day, every day.",
      "Documents and messages have to be read and sorted by hand.",
      "Decisions depend on data nobody has time to look through.",
      "AI has been tried, but as a demo rather than as part of the business.",
    ],
    builds: [
      "Customer-facing assistants grounded in the business's own content",
      "AI features inside an existing product",
      "Document, message and data classification pipelines",
      "Internal tools that summarise, draft and retrieve",
    ],
    technology: ["AI integrations", "Node.js", "REST APIs", "Supabase", "React"],
    useCases: [
      "Support teams answering repetitive enquiries",
      "Operations teams triaging inbound requests",
      "Products that need search or recommendations that understand intent",
    ],
  },
  {
    id: "automation",
    number: "03",
    title: "Automation",
    summary: "Replace repetitive manual processes with systems that work automatically.",
    includes: [
      "Business automation",
      "API integrations",
      "Notifications",
      "CRM workflows",
      "Data workflows",
    ],
    overview:
      "Most businesses lose hours to work that a system should be doing: re-typing data between tools, chasing confirmations, compiling the same report. We map the process, then remove the manual steps one at a time.",
    problems: [
      "The same information is entered into three different tools.",
      "Customers are updated late because someone has to remember to update them.",
      "Reports are compiled by hand at the end of every week or month.",
      "Tools the business already pays for do not talk to each other.",
    ],
    builds: [
      "Process automation across existing tools",
      "API integrations between systems that were never designed to connect",
      "Automated notifications by email, SMS and messaging apps",
      "CRM and pipeline workflows",
      "Scheduled data workflows and reporting",
    ],
    technology: ["Node.js", "Express", "REST APIs", "MongoDB", "Supabase"],
    useCases: [
      "Sales teams losing leads between tools",
      "Operations that run on spreadsheets and reminders",
      "Finance and reporting work repeated on a fixed schedule",
    ],
  },
  {
    id: "digital-products",
    number: "04",
    title: "Digital Products",
    summary:
      "From startup idea to working product, we design and build scalable digital experiences.",
    includes: ["MVP development", "SaaS", "Startup platforms", "Custom systems"],
    overview:
      "An idea becomes a product the moment someone can use it. We help define what the first version must do, cut what it should not, and build something real enough to put in front of users — architected so version two is not a rewrite.",
    problems: [
      "There is an idea, but no clear first version.",
      "The scope keeps growing and nothing ships.",
      "Off-the-shelf software does not fit how the business actually works.",
      "An early build cannot carry the users it now has.",
    ],
    builds: [
      "Product strategy and scoping for a first release",
      "MVPs built to be used, not demoed",
      "SaaS platforms with accounts, billing and roles",
      "Custom internal systems",
      "Marketplaces and multi-sided platforms",
    ],
    technology: ["React", "Next.js", "TypeScript", "Node.js", "Supabase", "MongoDB", "REST APIs"],
    useCases: [
      "A founder validating an idea with real users",
      "A business whose workflow no product on the market matches",
      "A platform that has outgrown its first build",
    ],
  },
] as const;
