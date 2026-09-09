import { Section, SectionHeading, Reveal } from "../ui";
import { ServiceCard } from "../cards";
import { SERVICES } from "../../data/services";

export function WhatWeBuild() {
  return (
    <Section id="what-we-build">
      <SectionHeading
        eyebrow="What we build"
        title="Technology designed around your business, not the other way around."
      />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:gap-6">
        {SERVICES.map((service, index) => (
          <Reveal key={service.id} delay={index * 0.06}>
            <div className="h-full">
              <ServiceCard service={service} />
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
