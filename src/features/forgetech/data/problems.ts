/** Problem → solution pairs. The homepage's most important section: it lets a
 *  visitor recognise their own situation before reading a single service name. */
export interface ProblemSolution {
  readonly id: string;
  readonly problem: string;
  readonly solution: string;
  readonly detail: string;
  /** Which service answers it — links the section to the Services page. */
  readonly serviceId: string;
}

export const PROBLEM_SOLUTIONS: readonly ProblemSolution[] = [
  {
    id: "invisible",
    problem: "Customers can't find us online.",
    solution: "A high-converting website with a strong digital presence.",
    detail:
      "A site built to be found, to load fast, and to give a visitor one obvious next step instead of a phone number and hope.",
    serviceId: "websites",
  },
  {
    id: "manual",
    problem: "We're doing everything manually.",
    solution: "Business automation that handles repetitive processes.",
    detail:
      "We map the process end to end, then remove the steps a person should not be doing — data entry, follow-ups, reporting, reminders.",
    serviceId: "automation",
  },
  {
    id: "platform",
    problem: "Our customers need a platform.",
    solution: "A custom web application built around their workflow.",
    detail:
      "Accounts, roles, data and the specific flow your customers actually follow — not a generic tool bent into shape.",
    serviceId: "digital-products",
  },
  {
    id: "idea",
    problem: "We have an idea but don't know where to start.",
    solution: "Product strategy + MVP development.",
    detail:
      "We define the smallest version worth building, agree what it must prove, and ship something real users can use.",
    serviceId: "digital-products",
  },
] as const;
