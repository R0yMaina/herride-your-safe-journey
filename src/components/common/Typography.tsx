import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Display({ className, ...p }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1 className={cn("font-display text-4xl leading-tight text-foreground", className)} {...p} />
  );
}
export function Heading({ className, ...p }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("font-display text-2xl text-foreground", className)} {...p} />;
}
export function Body({ className, ...p }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...p} />;
}
export function Eyebrow({ className, ...p }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "text-[10px] font-medium uppercase tracking-[0.28em] text-primary/80",
        className,
      )}
      {...p}
    />
  );
}
