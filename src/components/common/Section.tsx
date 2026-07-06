import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  readonly title?: string;
  readonly action?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}

export function Section({ title, action, children, className }: SectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between">
          {title && <h2 className="font-display text-lg text-foreground">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}