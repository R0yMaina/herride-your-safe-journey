import { cn } from "@/lib/utils";

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60",
        className,
      )}
    />
  );
}
