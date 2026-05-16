import { createFileRoute } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppHeader } from "@/components/AppHeader";
import { BottomTabBar } from "@/components/BottomTabBar";
import { Plus, MapPin, Clock } from "lucide-react";

export const Route = createFileRoute("/scheduled")({
  head: () => ({ meta: [{ title: "Scheduled — HerRide" }, { name: "description", content: "Schedule rides ahead." }] }),
  component: Scheduled,
});

const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const dates = [13,14,15,16,17,18,19];

function Scheduled() {
  return (
    <PhoneFrame>
      <div className="min-h-full pb-28">
        <AppHeader title="Scheduled rides" back="/home" />
        <div className="px-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {days.map((d,i)=>{const active=i===3;return(
              <div key={d} className={`min-w-[52px] py-3 rounded-2xl text-center border ${active?"bg-primary text-primary-foreground border-primary shadow-glow":"bg-card border-border"}`}>
                <div className="text-[10px] uppercase tracking-wider opacity-70">{d}</div>
                <div className="font-display text-lg font-semibold">{dates[i]}</div>
              </div>
            );})}
          </div>
          <div className="mt-5 bg-gradient-pink rounded-3xl p-5 text-noir relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/30 blur-2xl" />
            <div className="relative">
              <div className="text-xs font-semibold uppercase tracking-wider">Next ride</div>
              <div className="font-display text-2xl font-semibold mt-1">Tomorrow · 7:45 AM</div>
              <div className="flex items-center gap-2 text-sm mt-2"><MapPin className="w-4 h-4" /> Home → UCLA Library</div>
              <div className="flex items-center gap-2 text-xs opacity-80 mt-1"><Clock className="w-3.5 h-3.5" /> Auto-match female driver 15 min prior</div>
            </div>
          </div>
          <h2 className="font-display text-lg font-semibold mt-6 mb-2">Upcoming</h2>
          <div className="space-y-2">
            {[{d:"Thu · 9:30 PM",from:"Office",to:"Home",p:"$11.40"},{d:"Sat · 8:00 PM",from:"Home",to:"The Roxy",p:"$14.20"},{d:"Sun · 10:00 AM",from:"Home",to:"Mom's Brunch",p:"$8.90"}].map((r)=>(
              <div key={r.d} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center text-primary"><Clock className="w-5 h-5" /></div>
                <div className="flex-1"><div className="text-xs text-muted-foreground">{r.d}</div><div className="text-sm font-semibold">{r.from} → {r.to}</div></div>
                <div className="font-display text-lg">{r.p}</div>
              </div>
            ))}
          </div>
          <button className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold shadow-glow"><Plus className="w-4 h-4" /> Schedule new ride</button>
        </div>
        <BottomTabBar />
      </div>
    </PhoneFrame>
  );
}