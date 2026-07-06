import { Link, useRouterState } from "@tanstack/react-router";
import { Home, MapPin, Wallet, User } from "lucide-react";
import { motion } from "framer-motion";
import { ROUTES, type AppRoute } from "@/constants/routes";
import { cn } from "@/lib/utils";

interface NavItem {
  readonly to: AppRoute;
  readonly label: string;
  readonly Icon: typeof Home;
}

const NAV_ITEMS: readonly NavItem[] = [
  { to: ROUTES.home, label: "Home", Icon: Home },
  { to: ROUTES.rides, label: "Rides", Icon: MapPin },
  { to: ROUTES.wallet, label: "Wallet", Icon: Wallet },
  { to: ROUTES.profile, label: "Profile", Icon: User },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-6"
    >
      <div className="pointer-events-auto flex w-[92%] max-w-md items-center justify-between rounded-full border border-border/60 bg-card/70 px-3 py-2 shadow-soft backdrop-blur-2xl">
        {NAV_ITEMS.map(({ to, label, Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 rounded-full px-3 py-2 text-[10px] font-medium tracking-wide transition-colors",
                active ? "text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-pink shadow-glow"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                />
              )}
              <Icon className="h-5 w-5" aria-hidden />
              <span className="uppercase tracking-[0.18em]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}