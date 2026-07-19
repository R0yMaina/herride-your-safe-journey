import { cn } from "@/lib/utils";

interface HeRideMarkProps {
  readonly size?: number;
  readonly className?: string;
}

export function HeRideMark({ size = 96, className }: HeRideMarkProps) {
  return (
    <div
      className={cn(
        "relative grid place-items-center rounded-[28%] bg-gradient-pink shadow-glow",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label="HeRide"
      role="img"
    >
      <span className="font-display text-[1.9rem] font-semibold leading-none text-noir">
        He<span className="italic text-noir/80">.</span>
      </span>
    </div>
  );
}
