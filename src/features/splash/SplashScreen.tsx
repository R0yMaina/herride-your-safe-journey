import { motion } from "framer-motion";
import { HeRideMark } from "@/components/brand/HeRideMark";
import { appConfig } from "@/config/app.config";

/** Pure presentational splash — routing decisions live in SplashRouter. */
export function SplashScreen() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-noir px-6">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[420px] w-[420px] rounded-full bg-primary-glow/25 blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        <motion.div
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 140, delay: 0.1 }}
        >
          <HeRideMark size={128} />
        </motion.div>
        <span className="mt-8 text-[10px] font-medium uppercase tracking-[0.4em] text-primary/80">
          {appConfig.name}
        </span>
        <h1 className="mt-2 font-display text-5xl font-semibold text-foreground text-glow">
          {appConfig.tagline}
        </h1>
        <div className="mt-10 h-[3px] w-40 overflow-hidden rounded-full bg-primary/15">
          <motion.div
            className="h-full bg-gradient-pink"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
            style={{ width: "60%" }}
          />
        </div>
      </motion.div>
      <div className="absolute bottom-8 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
        Moving her, safely.
      </div>
    </div>
  );
}