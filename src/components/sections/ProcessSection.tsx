import { Section, SectionHeading } from "../ui";
import { ProcessTimeline } from "./ProcessTimeline";

export function ProcessSection() {
  return (
    <Section id="process" tone="cream-deep" bordered>
      <SectionHeading
        eyebrow="How we work"
        title="From idea to launch."
        lead="The same seven steps on every project, whether it is a website or a platform."
      />
      <ProcessTimeline />
    </Section>
  );
}
