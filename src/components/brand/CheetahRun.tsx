import { motion, useReducedMotion } from "framer-motion";
import { CheetahMark } from "./CheetahMark";
import { cn } from "@/lib/utils";

interface CheetahRunProps {
  /** Width of the cheetah in px. */
  readonly size?: number;
  readonly className?: string;
  /** Fired once the sprint settles, so the caller can reveal the wordmark. */
  readonly onSettled?: () => void;
}

/** Ghosted copies trailing the runner — the classic speed-blur read. */
const TRAILS = [
  { delay: 0.06, opacity: 0.28 },
  { delay: 0.12, opacity: 0.16 },
  { delay: 0.18, opacity: 0.08 },
];

/** Horizontal streaks that rip past as she crosses the frame. */
const SPEED_LINES = [
  { top: "30%", width: 120, delay: 0.15 },
  { top: "46%", width: 180, delay: 0.05 },
  { top: "58%", width: 90, delay: 0.24 },
  { top: "68%", width: 150, delay: 0.12 },
];

/**
 * The HeRide entrance: the cheetah sprints in from the left, trailing motion
 * ghosts and speed lines, then settles at centre.
 *
 * A real gait cycle would need frame-by-frame artwork — one silhouette can't
 * be posed. What sells the run here is motion language instead: a hard
 * decelerating dash, after-images, streaks, and a subtle vertical bob that
 * reads as stride without deforming the mark.
 *
 * Honours prefers-reduced-motion by simply fading in.
 */
export function CheetahRun({ size = 200, className, onSettled }: CheetahRunProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <motion.div
        className={cn("relative", className)}
        style={{ width: size }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        onAnimationComplete={onSettled}
      >
        <CheetahMark className="w-full text-foreground" />
      </motion.div>
    );
  }

  return (
    <div className={cn("relative", className)} style={{ width: size }}>
      {/* Speed lines — drawn behind, sweeping right to left past the runner. */}
      {SPEED_LINES.map(({ top, width, delay }, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute h-[2px] rounded-full bg-foreground/25"
          style={{ top, width }}
          initial={{ x: size * 0.9, opacity: 0 }}
          animate={{ x: -size * 1.4, opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.55, delay, ease: "easeOut" }}
        />
      ))}

      {/* Motion ghosts — same silhouette, lagging behind the leader. */}
      {TRAILS.map(({ delay, opacity }, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          initial={{ x: "-135%", opacity: 0 }}
          animate={{ x: "0%", opacity: [0, opacity, 0] }}
          transition={{ duration: 0.9, delay, ease: [0.16, 0.8, 0.3, 1] }}
        >
          <CheetahMark className="w-full text-foreground" />
        </motion.div>
      ))}

      {/* The runner. The y keyframes are the stride: a shallow bob that
          settles flat, so she looks like she lands rather than glides. */}
      <motion.div
        initial={{ x: "-135%", opacity: 0 }}
        animate={{
          x: "0%",
          opacity: 1,
          y: [0, -6, 2, -3, 0],
          scaleX: [1.06, 1.06, 1, 1, 1],
        }}
        transition={{
          duration: 0.9,
          ease: [0.16, 0.8, 0.3, 1],
          y: { duration: 0.9, times: [0, 0.3, 0.55, 0.78, 1] },
          scaleX: { duration: 0.9, times: [0, 0.4, 0.7, 0.85, 1] },
        }}
        onAnimationComplete={onSettled}
      >
        <CheetahMark className="w-full text-foreground" />
      </motion.div>
    </div>
  );
}
