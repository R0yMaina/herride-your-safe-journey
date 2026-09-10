/** How a project runs, start to finish. Seven steps, no padding. */
export interface ProcessStep {
  readonly number: string;
  readonly title: string;
  readonly summary: string;
  readonly detail: string;
}

export const PROCESS_STEPS: readonly ProcessStep[] = [
  {
    number: "01",
    title: "Discover",
    summary: "We understand your business, users and problem.",
    detail:
      "Before anything is designed we get clear on who this is for, what it has to change, and what happens today without it.",
  },
  {
    number: "02",
    title: "Strategize",
    summary: "We define the product, features and technology required.",
    detail:
      "Scope, priorities and architecture. This is where we decide what version one is — and, more usefully, what it is not.",
  },
  {
    number: "03",
    title: "Design",
    summary: "We create the user experience and visual direction.",
    detail:
      "Structure first, surface second: the flow a user moves through, then the interface that carries it.",
  },
  {
    number: "04",
    title: "Build",
    summary: "Development begins using modern technologies.",
    detail:
      "Built in working increments you can see, with the architecture chosen for where the product is going, not only where it starts.",
  },
  {
    number: "05",
    title: "Test",
    summary: "We test functionality, usability, responsiveness and performance.",
    detail:
      "Real devices, real conditions, real edge cases — including the slow connections much of the market is actually on.",
  },
  {
    number: "06",
    title: "Launch",
    summary: "Your product goes live.",
    detail: "Deployment, domains, analytics and a handover that leaves you able to run it.",
  },
  {
    number: "07",
    title: "Scale",
    summary: "We improve and expand the product as the business grows.",
    detail:
      "What launched is version one. We keep improving it against how people actually use it.",
  },
] as const;
