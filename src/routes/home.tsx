import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomTabBar } from "@/components/BottomTabBar";
import { MapCanvas } from "@/components/MapCanvas";
import { Search, Home as HomeIcon, Briefcase, Heart, ShieldAlert, GraduationCap, ChevronRight, Menu } from "lucide-react";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "Home — HerRide" }, { name: "description", content: "Book your safe ride." }] }),
  component: Home,
});

function Home() {
  return (
    <PhoneFrame>
      <div className="relative min-h-full">
        <div className="absolute inset-0">
          <MapCanvas />
        </div>

        <div className="relative z-10 p-4 flex items-center justify-between">
          <button className="w-11 h-11 rounded-full bg-card/90 backdrop-blur border border-border flex items-center justify-center">
            <Menu className="w-5 h-5" />
          </button>
          <div className="px-3 py-1.5 rounded-full bg-card/90 backdrop-blur border border-border text-xs font-semibold">
            <span className="text-primary">●</span> Female-only zone
          </div>
          <Link to="/sos" className="w-11 h-11 rounded-full bg-destructive/20 backdrop-blur border border-destructive/40 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-destructive" />
          </Link>
        </div>

        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 z-10 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 animate-ping absolute" />
          <div className="w-6 h-6 rounded-full bg-primary border-4 border-noir relative shadow-glow" />
        </div>

        <div className="absolute bottom-24 left-0 right-0 z-20 px-4">
          <div className="bg-card/95 backdrop-blur-xl border border-border rounded-3xl p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Good evening, Sofia</p>
                <h2 className="font-display text-xl font-semibold">Where to tonight?</h2>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Wallet</div>
                <div className="text-sm font-semibold text-primary">Ksh 5,500</div>
              </div>
            </div>

            <Link to="/book" className="flex items-center gap-3 bg-secondary border border-border rounded-2xl px-4 py-3.5">
              <Search className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground flex-1">Search destination</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>

            <div className="grid grid-cols-4 gap-2 mt-4">
              {[
                { i: HomeIcon, l: "Home" },
                { i: Briefcase, l: "Work" },
                { i: Heart, l: "Mom" },
                { i: GraduationCap, l: "Campus" },
              ].map(({ i: Icon, l }) => (
                <button key={l} className="flex flex-col items-center gap-1.5 py-2.5 bg-secondary rounded-2xl">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-[11px] font-medium">{l}</span>
                </button>
              ))}
            </div>

            <Link to="/student" className="mt-4 flex items-center gap-3 bg-gradient-pink rounded-2xl p-3">
              <div className="w-10 h-10 rounded-xl bg-noir/20 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-noir" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-noir">20% off student rides</div>
                <div className="text-xs text-noir/70">Verify your .edu email</div>
              </div>
              <ChevronRight className="w-4 h-4 text-noir" />
            </Link>

            <div className="grid grid-cols-3 gap-2 mt-3">
              <Link to="/subscriptions" className="text-[10px] text-center py-2 rounded-xl bg-secondary border border-border font-semibold">Plans</Link>
              <Link to="/shared-rides" className="text-[10px] text-center py-2 rounded-xl bg-secondary border border-border font-semibold">HerShare</Link>
              <Link to="/scheduled" className="text-[10px] text-center py-2 rounded-xl bg-secondary border border-border font-semibold">Schedule</Link>
            </div>
          </div>
        </div>

        <BottomTabBar />
      </div>
    </PhoneFrame>
  );
}