import { Section, SectionHeading } from "../ui";
import { ProblemSolutionExplorer } from "../cards";

export function ProblemSolutionSection() {
  return (
    <Section tone="cream-deep" bordered>
      <SectionHeading
        eyebrow="Problem / Solution"
        title={
          <>
            Your business has a problem.{" "}
            <span className="ft-accent text-ft-navy-soft">We build the system that solves it.</span>
          </>
        }
        lead="Start with the sentence that sounds like your situation."
      />
      <div className="mt-14 lg:mt-16">
        <ProblemSolutionExplorer />
      </div>
    </Section>
  );
}
