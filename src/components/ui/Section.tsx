import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Container } from "./Container";

type Tone = "cream" | "cream-deep" | "navy";

const TONES: Record<Tone, string> = {
  cream: "bg-ft-cream",
  "cream-deep": "bg-ft-cream-deep",
  navy: "bg-ft-navy-deep",
};

/** Vertical rhythm for the whole site, in one place. Mobile spacing is set
 *  independently — it is not a scaled-down desktop value. */
export function Section({
  children,
  id,
  tone = "cream",
  className,
  containerSize,
  bordered,
}: {
  children: ReactNode;
  id?: string;
  tone?: Tone;
  className?: string;
  containerSize?: "default" | "narrow" | "wide";
  bordered?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 py-20 sm:py-28 lg:py-36",
        TONES[tone],
        bordered && "border-t border-ft-line",
        className,
      )}
    >
      <Container size={containerSize}>{children}</Container>
    </section>
  );
}
