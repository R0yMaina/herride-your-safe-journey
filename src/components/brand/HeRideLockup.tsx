import { cn } from "@/lib/utils";
import { CheetahMark } from "./CheetahMark";

interface HeRideLockupProps {
  /** Height of the cheetah in px; the wordmark scales with it. */
  readonly size?: number;
  readonly className?: string;
  /** Hide the wordmark and show the cheetah alone. */
  readonly markOnly?: boolean;
}

/**
 * Horizontal brand lockup: the cheetah running toward the wordmark.
 *
 * "Her" carries the full brand violet and "ide" drops to a lighter tint, so
 * the eye reads HER first while the name still says HeRide.
 */
export function HeRideLockup({ size = 28, className, markOnly = false }: HeRideLockupProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-2.5 text-primary", className)}
      aria-label="HeRide"
      role="img"
    >
      <CheetahMark className="shrink-0" style={{ width: size * 2.6 }} />
      {!markOnly && (
        <span
          className="font-display font-semibold leading-none tracking-tight text-foreground"
          style={{ fontSize: size }}
        >
          Her<span className="text-muted-foreground">ide</span>
        </span>
      )}
    </span>
  );
}
