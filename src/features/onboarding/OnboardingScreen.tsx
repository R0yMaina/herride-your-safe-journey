import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { HeRideMark } from "@/components/brand/HeRideMark";
import { PrimaryButton } from "@/features/auth/components/PrimaryButton";
import { useOnboardingStore } from "@/store/onboarding.store";
import { ROUTES } from "@/constants/routes";
import { ONBOARDING_STEPS } from "./data/steps";
import { cn } from "@/lib/utils";

export function OnboardingScreen() {
  const navigate = useNavigate();
  const complete = useOnboardingStore((s) => s.complete);
  const [index, setIndex] = useState(0);
  const step = ONBOARDING_STEPS[index];
  const isLast = index === ONBOARDING_STEPS.length - 1;

  const finish = () => {
    complete();
    void navigate({ to: ROUTES.welcome, replace: true });
  };

  const next = () => (isLast ? finish() : setIndex((i) => i + 1));

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-noir">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-3xl" />

      <header className="relative z-10 flex items-center justify-between px-6 pt-6">
        <HeRideMark size={40} />
        <button
          type="button"
          onClick={finish}
          className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground hover:text-primary"
        >
          Skip
        </button>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col items-center gap-6"
          >
            <div className="grid h-24 w-24 place-items-center rounded-3xl bg-gradient-pink text-noir shadow-glow">
              <step.Icon className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-primary/80">
                {step.eyebrow}
              </span>
              <h1 className="font-display text-3xl leading-tight text-foreground text-glow">
                {step.title}
              </h1>
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-md space-y-6 px-6 pb-10">
        <div className="flex justify-center gap-2">
          {ONBOARDING_STEPS.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-8 bg-primary" : "w-1.5 bg-border/60",
              )}
            />
          ))}
        </div>
        <PrimaryButton onClick={next}>{isLast ? "Get started" : "Continue"}</PrimaryButton>
      </footer>
    </div>
  );
}
