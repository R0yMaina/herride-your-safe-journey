import { createFileRoute } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppHeader } from "@/components/AppHeader";
import { BottomTabBar } from "@/components/BottomTabBar";
import { Heart, Star } from "lucide-react";

export const Route = createFileRoute("/favorites")({
  head: () => ({ meta: [{ title: "Favorites — HerRide" }, { name: "description", content: "Your saved drivers." }] }),
  component: Favorites,
});

const drivers = [
  { n: "Maria L.", c: "Pink Tesla Model 3", r: 4.98, t: 12 },
  { n: "Sophie K.", c: "White BMW X1", r: 4.95, t: 8 },
  { n: "Lina R.", c: "Black Toyota Prius", r: 4.92, t: 5 },
  { n: "Aisha M.", c: "Blush Mini Cooper", r: 4.99, t: 4 },
];

function Favorites() {
  return (
    <PhoneFrame>
      <div className="min-h-full pb-28">
        <AppHeader title="Favorite drivers" back="/home" />
        <div className="px-4">
          <div className="bg-gradient-pink rounded-3xl p-5 text-noir mb-4">
            <div className="text-xs font-semibold uppercase tracking-wider">Sofia · Gold member</div>
            <div className="font-display text-2xl font-semibold mt-1">128 rides · 4.97 ★</div>
            <div className="text-xs opacity-70 mt-1">Member since March 2024</div>
          </div>
          <h2 className="font-display text-lg font-semibold mb-2">Saved drivers</h2>
          <div className="space-y-2">
            {drivers.map((d)=>(
              <div key={d.n} className="bg-card border border-border rounded-3xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-pink p-0.5"><div className="w-full h-full rounded-full bg-noir flex items-center justify-center font-display text-primary">{d.n[0]}</div></div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5"><span className="text-sm font-semibold">{d.n}</span><Heart className="w-3.5 h-3.5 fill-primary text-primary" /></div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5"><Star className="w-3 h-3 fill-primary text-primary" /> {d.r} · {d.t} rides · {d.c}</div>
                </div>
                <button className="text-xs font-semibold px-3 py-2 rounded-full bg-primary text-primary-foreground">Request</button>
              </div>
            ))}
          </div>
        </div>
        <BottomTabBar />
      </div>
    </PhoneFrame>
  );
}