import { motion } from "framer-motion";
import { Button } from "../ui/Button";
import { FT_ROUTES, SOCIALS } from "../../data/site";

/** What a visitor sees after submitting. It says what happens next, because
 *  "Thanks, we'll be in touch" is not information. */
export function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      className="rounded-2xl border border-ft-line bg-ft-cream-deep p-8 sm:p-12"
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-ft-navy text-lg text-ft-cream">
        ✓
      </span>

      <h2 className="mt-7 text-2xl font-bold text-ft-navy sm:text-3xl">Your brief is with us.</h2>
      <p className="mt-4 max-w-lg text-base leading-relaxed text-ft-navy-soft">
        We read it properly rather than skimming it, so a reply takes a little longer than an
        auto-responder — expect one within two working days, from a person, with questions about
        what you're trying to do.
      </p>

      <div className="mt-8 border-t border-ft-line pt-7">
        <h3 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-navy-soft">
          While you wait
        </h3>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button to={FT_ROUTES.insights} variant="secondary">
            Read the Brief
          </Button>
          {SOCIALS.map((social) => (
            <Button key={social.label} href={social.href} variant="secondary">
              {social.label}
            </Button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="mt-8 text-sm text-ft-navy-soft underline underline-offset-4 transition-colors hover:text-ft-navy"
      >
        Submit another project
      </button>
    </motion.div>
  );
}
