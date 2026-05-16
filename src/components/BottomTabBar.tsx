import { Link, useLocation } from "@tanstack/react-router";
import { Home, Wallet, CalendarClock, User } from "lucide-react";

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/scheduled", label: "Rides", icon: CalendarClock },
  { to: "/favorites", label: "Profile", icon: User },
];

export function BottomTabBar() {
  const { pathname } = useLocation();
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-2">
      <div className="bg-noir/90 backdrop-blur-xl border border-border rounded-3xl px-3 py-2 flex items-center justify-between shadow-soft">
        {tabs.map((t) => {
          const active = pathname === t.to;
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`flex flex-col items-center justify-center flex-1 py-2 rounded-2xl transition-all ${
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] mt-0.5 font-medium">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}