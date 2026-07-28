import { motion } from "framer-motion";
import { Link, useNavigate } from "@tanstack/react-router";
import { CarFront, ShieldCheck, Sparkles } from "lucide-react";
import { HeRideMark } from "@/components/brand/HeRideMark";
import { PrimaryButton } from "../components/PrimaryButton";
import { setSignupIntent } from "../lib/signup-intent";
import { ROUTES } from "@/constants/routes";
import { appConfig } from "@/config/app.config";

export function WelcomeScreen() {
  const navigate = useNavigate();

  // The two doors: same account system, different first-run experience.
  const enter = (intent: "passenger" | "driver") => {
    setSignupIntent(intent);
    void navigate({ to: ROUTES.signUp });
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-noir">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary-glow/25 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[320px] w-[320px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-10 pt-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mx-auto"
        >
          <HeRideMark size={112} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-10 space-y-3"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-primary/80">
            {appConfig.name}
          </span>
          <h1 className="font-display text-4xl leading-tight text-foreground text-glow">
            {appConfig.tagline}
          </h1>
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
            A private, premium ride experience designed around her safety, dignity, and time.
          </p>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 space-y-3 text-left"
        >
          {[
            { Icon: ShieldCheck, text: "Verified female drivers, background-checked." },
            { Icon: Sparkles, text: "Live trip share and SOS in one tap." },
          ].map(({ Icon, text }) => (
            <li
              key={text}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-3 backdrop-blur-xl"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm text-foreground">{text}</span>
            </li>
          ))}
        </motion.ul>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-auto space-y-3 pt-10"
        >
          <PrimaryButton onClick={() => enter("passenger")}>Ride with HeRide</PrimaryButton>
          <PrimaryButton
            variant="ghost"
            leading={<CarFront className="h-4 w-4 text-primary" />}
            onClick={() => enter("driver")}
          >
            Drive with HeRide — earn on your terms
          </PrimaryButton>
          <Link to={ROUTES.signIn}>
            <PrimaryButton variant="ghost">I already have an account</PrimaryButton>
          </Link>
          <p className="pt-4 text-[11px] text-muted-foreground">
            By continuing you agree to our Terms & Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
