/** The manifesto section. Four principles, stated plainly. */
export interface Principle {
  readonly label: string;
  readonly body: string;
}

export const PRINCIPLES: readonly Principle[] = [
  {
    label: "Business first",
    body: "Technology should contribute to a real business objective. If a feature cannot be traced back to one, it does not get built.",
  },
  {
    label: "User first",
    body: "Beautiful software means nothing if people cannot use it. We design for the person under pressure, on a mid-range phone, in a hurry.",
  },
  {
    label: "Built to scale",
    body: "We think beyond today's version of the product. The first release is architected so the second one is not a rewrite.",
  },
  {
    label: "AI-ready",
    body: "We build with the future of intelligent software in mind — structured data, clear interfaces, systems that can be extended rather than replaced.",
  },
] as const;

/** About page — how we work, in five lines. */
export const ABOUT_PRINCIPLES: readonly string[] = [
  "Think deeply",
  "Build simply",
  "Solve real problems",
  "Design for people",
  "Build for the future",
] as const;
