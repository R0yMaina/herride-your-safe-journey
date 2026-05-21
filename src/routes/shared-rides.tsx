import { createFileRoute } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppHeader } from "@/components/AppHeader";
import { BadgeCheck, Users } from "lucide-react";

export const Route = createFileRoute("/shared-rides")({
  head: () => ({ meta: [{ title: "HerShare — HeriRide" }, { name: "description", content: "Split fares with verified women." }] }),
  component: Shared,
});

const matches = [
  { name: "Amelia", route: "UCLA → Westwood", save: "60%", r: 4.9 },
  { name: "Priya", route: "UCLA → Santa Monica", save: "45%", r: 4.8 },
  { name: "Jess + Noor", route: "UCLA → Beverly Hills", save: "70%", r: 4.95 },
];

function Shared() {
  return (
    <PhoneFrame>
      <div className="min-h-full pb-6">
        <AppHeader title="HerShare" back="/book" />
        <div className="px-4 space-y-4">
          <div className="bg-card border border-border rounded-3xl p-5">
            <div className="flex items-center gap-2 text-primary text-xs font-semibold"><Users className="w-4 h-4" /> VERIFIED WOMEN ONLY</div>
            <h2 className="font-display text-2xl font-semibold mt-2">Split the ride, half the cost.</h2>
            <p className="text-sm text-muted-foreground mt-1">Match with women on your exact route. Every co-rider is identity-verified.</p>
          </div>
          <div className="space-y-2">
            {matches.map((m)=>(
              <div key={m.name} className="bg-card border border-border rounded-3xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-pink p-0.5"><div className="w-full h-full rounded-full bg-noir flex items-center justify-center font-display text-primary text-lg">{m.name[0]}</div></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5"><span className="text-sm font-semibold">{m.name}</span><BadgeCheck className="w-4 h-4 text-primary" /></div>
                    <div className="text-xs text-muted-foreground">{m.route} · ★ {m.r}</div>
                  </div>
                  <div className="text-right"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Save</div><div className="font-display text-lg text-primary font-semibold">{m.save}</div></div>
                </div>
                <button className="mt-3 w-full py-2.5 rounded-full bg-primary/15 text-primary text-sm font-semibold">Join ride</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}