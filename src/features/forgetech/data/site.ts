/**
 * Forgetech — single source of truth for brand facts, navigation and links.
 *
 * Nothing in here is invented. Only the handles, domain and positioning the
 * company actually gave us live here; sections that need real numbers
 * (clients, results, team) are built to accept them later rather than being
 * filled with placeholders that read as fact.
 */

export const SITE = {
  name: "Forgetech",
  tagline: "Building Africa's Future With AI & Software.",
  domain: "forgetech.ke",
  url: "https://forgetech.ke",
  descriptor: "Digital technology studio",
  positioning: "Built in Africa. Designed for the world.",
} as const;

export const SOCIALS = [
  {
    label: "Instagram",
    handle: "@forge.tech._",
    href: "https://instagram.com/forge.tech._",
  },
  {
    label: "TikTok",
    handle: "forgetechsolutions",
    href: "https://tiktok.com/@forgetechsolutions",
  },
] as const;

/** Route paths for the marketing site. Mirrors `src/constants/routes.ts`'s
 *  intent — no hardcoded path strings in components. */
export const FT_ROUTES = {
  home: "/forgetech",
  services: "/forgetech/services",
  work: "/forgetech/work",
  caseStudy: "/forgetech/work/$slug",
  process: "/forgetech/process",
  insights: "/forgetech/insights",
  article: "/forgetech/insights/$slug",
  about: "/forgetech/about",
  contact: "/forgetech/contact",
} as const;

export const NAV_LINKS = [
  { label: "Home", to: FT_ROUTES.home },
  { label: "Services", to: FT_ROUTES.services },
  { label: "Work", to: FT_ROUTES.work },
  { label: "Process", to: FT_ROUTES.process },
  { label: "Insights", to: FT_ROUTES.insights },
  { label: "About", to: FT_ROUTES.about },
  { label: "Contact", to: FT_ROUTES.contact },
] as const;

export const FOOTER_COLUMNS = [
  {
    title: "Company",
    links: [
      { label: "About", to: FT_ROUTES.about },
      { label: "Work", to: FT_ROUTES.work },
      { label: "Process", to: FT_ROUTES.process },
      { label: "Insights", to: FT_ROUTES.insights },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Websites", to: FT_ROUTES.services, hash: "websites" },
      { label: "AI", to: FT_ROUTES.services, hash: "ai" },
      { label: "Automation", to: FT_ROUTES.services, hash: "automation" },
      { label: "Digital Products", to: FT_ROUTES.services, hash: "digital-products" },
    ],
  },
] as const;
