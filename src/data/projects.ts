/**
 * Case studies.
 *
 * Deliberately factual. No metrics, revenue figures, user counts or
 * testimonials appear anywhere in this file, because none have been provided.
 * `outcome` is nullable and the case-study page renders an honest state when
 * it is null rather than inventing a result — fill it in when there is a
 * measured one to report.
 */
export interface CaseStudy {
  readonly slug: string;
  readonly name: string;
  readonly category: string;
  readonly industry: string;
  readonly summary: string;
  readonly problem: string;
  readonly approach: string;
  readonly solution: string;
  readonly technology: readonly string[];
  readonly features: readonly string[];
  /** Only ever a measured, provided result. `null` until there is one. */
  readonly outcome: string | null;
  /** Two-tone abstract mark rendered instead of a stock image. */
  readonly motif: "route" | "pulse" | "grid";
}

export const CASE_STUDIES: readonly CaseStudy[] = [
  {
    slug: "heride",
    name: "HeRide",
    category: "Mobility / Technology",
    industry: "Mobility",
    summary: "A women-focused ride platform designed around safety, convenience and accessibility.",
    problem:
      "For many women, the risk in a ride is not the journey — it is not knowing who is driving, whether anyone else knows where they are, and what happens if something goes wrong. Conventional ride-hailing treats safety as a setting. It needed to be the product.",
    approach:
      "We designed the platform around the moments that matter rather than the map: who is verified before they can drive, what a rider can see before getting in, who is told when a trip starts, and what one button does when a trip stops feeling right. Every other feature was scoped around those.",
    solution:
      "A rider and driver platform with identity verification, trusted contacts, live trip sharing, an emergency path, and a wallet and fare system that leaves no ambiguity about what a ride costs.",
    technology: ["React", "TypeScript", "Tailwind CSS", "Supabase", "REST APIs"],
    features: [
      "Driver identity verification and periodic re-checks",
      "Trusted contacts and shareable live trip links",
      "In-app emergency flow",
      "Transparent, itemised fares and a wallet",
      "Rider and driver apps in one platform",
    ],
    outcome: null,
    motif: "route",
  },
  {
    slug: "medireach",
    name: "MediReach",
    category: "Health Technology / Emergency Response",
    industry: "Health technology",
    summary: "A digital platform designed to help connect people with emergency assistance faster.",
    problem:
      "In an emergency the delay is rarely the treatment — it is the search. Finding who can help, reaching them, and explaining where you are all cost minutes at the point where minutes decide the outcome.",
    approach:
      "We treated the first sixty seconds as the whole design problem: how few steps can stand between someone in trouble and the person who can respond, and how much of the context can the system supply on their behalf.",
    solution:
      "A platform that shortens the path between a person needing urgent help and the nearest available assistance, carrying location and situation forward so nothing has to be re-explained.",
    technology: ["React", "Node.js", "MongoDB", "REST APIs"],
    features: [
      "Fast request flow designed for one-handed, high-stress use",
      "Location carried with the request",
      "Responder-side view of what is needed and where",
      "Built for low-bandwidth conditions",
    ],
    outcome: null,
    motif: "pulse",
  },
  {
    slug: "sakakeja",
    name: "SakaKeja / NyumbaSearch",
    category: "Real Estate / Marketplace",
    industry: "Real estate",
    summary:
      "A digital platform designed to simplify the process of discovering and finding homes.",
    problem:
      "House hunting runs on group chats, brokers and screenshots. Listings are duplicated, stale or vague, and the same viewing is arranged three times before anyone sees a door.",
    approach:
      "We modelled the search the way people actually run it — by area, budget and what is genuinely still available — and made the listing itself carry enough information to rule a place in or out before anyone travels.",
    solution:
      "A marketplace where homes can be listed, filtered and compared in one place, built to keep listings current rather than accumulating them.",
    technology: ["React", "Node.js", "MongoDB", "Cloudinary", "REST APIs"],
    features: [
      "Search and filtering by location, budget and property type",
      "Listings with the detail needed to decide remotely",
      "Media handling built for slow connections",
      "Direct contact between seeker and lister",
    ],
    outcome: null,
    motif: "grid",
  },
] as const;

export const findCaseStudy = (slug: string): CaseStudy | undefined =>
  CASE_STUDIES.find((project) => project.slug === slug);
