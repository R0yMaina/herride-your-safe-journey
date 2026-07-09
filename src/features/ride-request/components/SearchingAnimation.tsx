import { motion } from "framer-motion";
import { HeRideMark } from "@/components/brand/HeRideMark";

/** Radial pulse loader used on the searching-for-driver screen. */
export function SearchingAnimation() {
  return (
    <div className="relative grid h-56 w-56 place-items-center">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded-full border border-primary/40"
          initial={{ scale: 0.4, opacity: 0.8 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
        />
      ))}
      <motion.div
        className="grid h-24 w-24 place-items-center rounded-full bg-gradient-pink shadow-glow"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <HeRideMark size={44} />
      </motion.div>
    </div>
  );
}