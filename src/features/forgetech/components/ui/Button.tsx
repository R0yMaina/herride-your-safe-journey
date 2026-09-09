import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "onDark" | "onDarkGhost";

const BASE =
  "group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold " +
  "transition-[transform,background-color,border-color,color] duration-200 ease-out " +
  "hover:-translate-y-px active:translate-y-0 whitespace-nowrap";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ft-navy text-ft-cream hover:bg-ft-navy-deep",
  secondary: "border border-ft-navy/25 text-ft-navy hover:border-ft-navy hover:bg-ft-navy/[0.04]",
  onDark: "bg-ft-gold text-ft-navy-deep hover:bg-ft-gold/90",
  onDarkGhost:
    "border border-ft-cream/30 text-ft-cream hover:border-ft-cream hover:bg-white/[0.06]",
};

interface Props {
  children: ReactNode;
  variant?: Variant;
  /** Internal route. */
  to?: string;
  /** Anchor within the target route. */
  hash?: string;
  /** External URL — rendered as an anchor with the right rel. */
  href?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  /** Adds the sliding arrow used on primary calls to action. */
  arrow?: boolean;
}

function Inner({ children, arrow }: { children: ReactNode; arrow?: boolean }) {
  return (
    <>
      {children}
      {arrow && (
        <span
          aria-hidden="true"
          className="transition-transform duration-200 ease-out group-hover:translate-x-1"
        >
          →
        </span>
      )}
    </>
  );
}

export function Button({
  children,
  variant = "primary",
  to,
  href,
  type = "button",
  onClick,
  disabled,
  className,
  arrow,
  hash,
}: Props) {
  const classes = cn(
    BASE,
    VARIANTS[variant],
    disabled && "cursor-not-allowed opacity-60",
    className,
  );

  if (to) {
    return (
      <Link to={to} hash={hash} className={classes}>
        <Inner arrow={arrow}>{children}</Inner>
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className={classes}>
        <Inner arrow={arrow}>{children}</Inner>
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      <Inner arrow={arrow}>{children}</Inner>
    </button>
  );
}
