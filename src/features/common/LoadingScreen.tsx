import { motion } from "framer-motion";
import { HeRideMark } from "@/components/brand/HeRideMark";

export function LoadingScreen({ label = "Preparing your experience" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-noir px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <HeRideMark size={72} />
      </motion.div>
      <div className="h-[3px] w-32 overflow-hidden rounded-full bg-primary/10">
        <motion.div
          className="h-full bg-gradient-pink"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
          style={{ width: "50%" }}
        />
      </div>
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
    </div>
  );
}