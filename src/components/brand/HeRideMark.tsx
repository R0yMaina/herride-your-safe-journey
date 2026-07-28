import { cn } from "@/lib/utils";
import { CheetahMark } from "./CheetahMark";

interface HeRideMarkProps {
  readonly size?: number;
  readonly className?: string;
}

/**
 * The app icon: the running cheetah in white on the violet gradient tile.
 * Used wherever HeRide signs itself — splash, welcome, auth header.
 */
export function HeRideMark({ size = 96, className }: HeRideMarkProps) {
  return (
    <div
      className={cn(
        "relative grid place-items-center overflow-hidden rounded-[28%] bg-gradient-pink shadow-glow",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label="HeRide"
      role="img"
    >
      <CheetahMark className="w-[74%] text-white" />
    </div>
  );
}
