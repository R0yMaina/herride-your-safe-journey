import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Doodles } from "@/components/Doodles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HerRide — Safe rides for women, by women." },
      { name: "description", content: "HerRide is a female-only ride-hailing app: safe, affordable, comfortable rides for women, driven by women." },
      { property: "og:title", content: "HerRide — Moving Women Safely" },
      { property: "og:description", content: "A premium female-only ride app. Verified female drivers, safety-first, affordable." },
    ],
  }),
  component: Splash,
});

function Splash() {
  return (
    <PhoneFrame>
      <div className="relative min-h-full bg-noir flex flex-col items-center justify-center px-6 py-12 overflow-hidden">
        <Doodles />
        {/* center glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[320px] h-[320px] rounded-full bg-primary-glow/20 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center text-center"
        >
          <span className="font-display italic text-primary/80 text-sm tracking-[0.3em] uppercase mb-4">
            est. 2026
          </span>
          <h1 className="font-display text-7xl font-semibold text-primary text-glow leading-none">
            HerRide
          </h1>
          <div className="mt-3 h-px w-24 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <p className="mt-5 text-primary/80 font-display italic text-lg">
            Safe rides for women, by women.
          </p>

          <div className="mt-12 w-40 h-[3px] rounded-full bg-primary/15 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-pink"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
              style={{ width: "60%" }}
            />
          </div>
          <p className="mt-3 text-xs tracking-widest text-muted-foreground uppercase">
            Loading your safe ride
          </p>

          <Link
            to="/auth"
            className="mt-14 px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-glow hover:scale-105 transition-transform"
          >
            Enter HerRide
          </Link>
        </motion.div>

        <div className="absolute bottom-6 left-0 right-0 text-center text-[10px] tracking-[0.4em] text-muted-foreground uppercase z-10">
          Moving Women Safely
        </div>
      </div>
    </PhoneFrame>
  );
}
