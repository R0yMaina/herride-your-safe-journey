import { useState } from "react";
import { motion } from "framer-motion";
import { CheetahRun } from "@/components/brand/CheetahRun";
import { appConfig } from "@/config/app.config";

/**
 * Pure presentational splash — routing decisions live in SplashRouter.
 *
 * The entrance is the brand: the cheetah sprints in from the left while a
 * violet panel wipes across behind her (the split from the brand artwork),
 * then the wordmark and tagline resolve once she lands.
 */
export function SplashScreen() {
  const [landed, setLanded] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-noir px-6">
      {/* Violet panel sweeps in behind the runner (the split from the brand
          artwork), then retreats once she lands — text over a half-violet
          screen can't hold contrast on both sides, so the brand resolves on
          clean white instead. */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 right-0 bg-gradient-pink"
        initial={{ width: "0%" }}
        animate={landed ? { width: "0%" } : { width: "50%" }}
        transition={
          landed
            ? { duration: 0.9, ease: [0.4, 0, 0.2, 1] }
            : { duration: 1.6, ease: [0.16, 0.8, 0.3, 1], delay: 0.18 }
        }
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[420px] w-[420px] rounded-full bg-ambient-blob blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <CheetahRun size={230} onSettled={() => setLanded(true)} />

        {/* Wordmark + tagline arrive only once she's landed. */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={landed ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="mt-6 font-display text-4xl font-semibold leading-none tracking-tight text-foreground">
            Her<span className="text-muted-foreground">ide</span>
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">
            {appConfig.tagline}
          </h1>
          <div className="mt-8 h-[3px] w-40 overflow-hidden rounded-full bg-primary/15">
            <motion.div
              className="h-full bg-gradient-pink"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              style={{ width: "60%" }}
            />
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-8 z-10 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
        Moving her, safely.
      </div>
    </div>
  );
}
