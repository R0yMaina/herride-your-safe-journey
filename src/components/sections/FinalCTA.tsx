import { Container, Reveal, Button } from "../ui";
import { Eyebrow, Rule } from "../ui/SectionHeading";
import { FT_ROUTES } from "../../data/site";

/** The one deliberately dark moment on the page. */
export function FinalCTA() {
  return (
    <section className="bg-ft-navy-deep py-24 sm:py-32 lg:py-40">
      <Container>
        <div className="max-w-3xl">
          <Reveal className="flex items-center gap-3">
            <Rule onDark />
            <Eyebrow onDark>Start here</Eyebrow>
          </Reveal>

          <Reveal delay={0.05}>
            <h2 className="mt-6 text-[2.25rem] font-bold leading-[1.05] text-ft-cream sm:text-[3.25rem] lg:text-[4rem]">
              Have an idea? <span className="ft-accent text-ft-gold">Let's build it.</span>
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-ft-cream/70 sm:text-lg">
              Whether you're starting from zero or improving an existing product, let's turn your
              idea into something people can actually use.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button to={FT_ROUTES.contact} variant="onDark" arrow>
                Start a Project
              </Button>
              <Button to={FT_ROUTES.contact} hash="talk" variant="onDarkGhost">
                Talk to Forgetech
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
