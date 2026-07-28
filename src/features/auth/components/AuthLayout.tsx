import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { HeRideMark } from "@/components/brand/HeRideMark";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly eyebrow?: string;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly backTo?: string;
  readonly showLogo?: boolean;
  readonly compact?: boolean;
}

export function AuthLayout({
  title,
  subtitle,
  eyebrow,
  children,
  footer,
  backTo,
  showLogo = true,
  compact,
}: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-noir">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-ambient blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary-glow/20 blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-6 pb-10">
        <div className="flex items-center justify-between">
          {backTo ? (
            <Link
              to={backTo}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-card/60 text-foreground backdrop-blur-xl"
              aria-label="Back"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          ) : (
            <span />
          )}
          {showLogo && (
            <Link to={ROUTES.splash} aria-label="HeRide home">
              <HeRideMark size={44} />
            </Link>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={cn("mt-8", compact && "mt-6")}
        >
          {eyebrow && (
            <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-primary/80">
              {eyebrow}
            </span>
          )}
          <h1 className="mt-2 font-display text-3xl leading-tight text-foreground">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
          className="mt-8 flex-1"
        >
          {children}
        </motion.div>

        {footer && <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}
