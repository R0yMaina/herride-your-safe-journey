import { createFileRoute } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppHeader } from "@/components/AppHeader";
import { Check, Copy, Link2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/share-trip")({
  head: () => ({ meta: [{ title: "Share trip — HerRide" }, { name: "description", content: "Share your live trip with trusted contacts." }] }),
  component: ShareTrip,
});

const contacts = [
  { name: "Mom", phone: "+1 555 010 2233", on: true },
  { name: "Lina (BFF)", phone: "+1 555 010 8821", on: true },
  { name: "Dad", phone: "+1 555 010 4488", on: true },
  { name: "Roommate Ava", phone: "+1 555 010 9020", on: false },
  { name: "Sister Mia", phone: "+1 555 010 7711", on: false },
];

function ShareTrip() {
  const [list, setList] = useState(contacts);
  return (
    <PhoneFrame>
      <div className="min-h-full pb-6">
        <AppHeader title="Share trip" back="/trip" sos={false} />
        <div className="px-4 space-y-4">
          <div className="bg-gradient-pink rounded-3xl p-5 text-noir relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/30 blur-2xl" />
            <div className="relative">
              <div className="text-xs font-semibold uppercase tracking-wider">Live trip link</div>
              <div className="font-display text-lg mt-1">herride.app/t/sofia-8a2</div>
              <div className="text-xs mt-1 opacity-70">Expires when your trip ends</div>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 bg-noir text-white rounded-full py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5"><Copy className="w-3.5 h-3.5" /> Copy link</button>
                <button className="flex-1 bg-white/90 text-noir rounded-full py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> Share</button>
              </div>
            </div>
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold px-1 mb-2">Trusted contacts</h2>
            <div className="bg-card border border-border rounded-3xl divide-y divide-border">
              {list.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-pink flex items-center justify-center font-display text-noir font-semibold">{c.name[0]}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.phone}</div>
                  </div>
                  <button
                    onClick={() => setList((l) => l.map((x, idx) => idx === i ? { ...x, on: !x.on } : x))}
                    className={`w-11 h-7 rounded-full p-0.5 transition-all ${c.on ? "bg-primary" : "bg-secondary"}`}
                  >
                    <span className={`block w-6 h-6 rounded-full bg-white transition-transform ${c.on ? "translate-x-4" : ""}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <button className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold shadow-glow inline-flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Start sharing with {list.filter(c => c.on).length}
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}