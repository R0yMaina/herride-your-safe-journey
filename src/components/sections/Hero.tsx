import { motion } from "framer-motion";
import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { Eyebrow } from "../ui/SectionHeading";
import { FT_ROUTES } from "../../data/site";
import { HeroVisual } from "./HeroVisual";

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-28 pt-14 sm:pb-32 sm:pt-20 lg:pb-40 lg:pt-24">
      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <motion.div custom={0} variants={fade} initial="hidden" animate="show">
              <Eyebrow>Forgetech / Digital Technology Studio</Eyebrow>
            </motion.div>

            <motion.h1
              custom={1}
              variants={fade}
              initial="hidden"
              animate="show"
              className="mt-6 text-[2.5rem] font-bold leading-[1.05] text-ft-navy sm:text-[3.5rem] lg:text-[4.25rem]"
            >
              We Build Digital Products That{" "}
              <span className="ft-accent text-ft-gold-deep">Move Businesses Forward.</span>
            </motion.h1>

            <motion.p
              custom={2}
              variants={fade}
              initial="hidden"
              animate="show"
              className="mt-7 max-w-xl text-base leading-relaxed text-ft-navy-soft sm:text-lg"
            >
              From high-converting websites to AI-powered platforms and business automation,
              Forgetech turns ideas and business problems into technology people can actually use.
            </motion.p>

            <motion.div
              custom={3}
              variants={fade}
              initial="hidden"
              animate="show"
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Button to={FT_ROUTES.contact} arrow>
                Start a Project
              </Button>
              <Button to={FT_ROUTES.work} variant="secondary">
                Explore Our Work
              </Button>
            </motion.div>
          </div>

          <div className="lg:pl-6">
            <HeroVisual />
          </div>
        </div>
      </Container>
    </section>
  );
}
