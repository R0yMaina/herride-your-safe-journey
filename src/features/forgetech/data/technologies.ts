/** The stack we work in. Grouped, because an ungrouped logo wall says nothing. */
export interface TechGroup {
  readonly label: string;
  readonly items: readonly string[];
}

export const TECH_GROUPS: readonly TechGroup[] = [
  { label: "Interface", items: ["React", "Next.js", "TypeScript", "Tailwind CSS"] },
  { label: "Server", items: ["Node.js", "Express", "REST APIs"] },
  { label: "Data", items: ["Supabase", "MongoDB", "Cloudinary"] },
  { label: "Intelligence", items: ["AI integrations", "JavaScript"] },
] as const;

/** Flat list for the ticker. */
export const TECHNOLOGIES: readonly string[] = TECH_GROUPS.flatMap((g) => g.items);
