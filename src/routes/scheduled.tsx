import { createFileRoute } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppHeader } from "@/components/AppHeader";
import { BottomTabBar } from "@/components/BottomTabBar";
import { Plus, MapPin, Clock, Calendar, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/scheduled")({
  head: () => ({ meta: [{ title: "Scheduled — HeriRide" }, { name: "description", content: "Schedule rides ahead." }] }),
  component: Scheduled,
});

const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const dates = [13,14,15,16,17,18,19];

function Scheduled() {
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledSuccess, setScheduledSuccess] = useState(false);

  if (scheduledSuccess) {
    return (
      <PhoneFrame>
        <div className="min-h-full pb-28 flex flex-col items-center justify-center p-6 text-center bg-background">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="font-display text-2xl font-semibold mb-2">Ride Scheduled!</h2>
          <p className="text-muted-foreground mb-8">Your HeriRide has been confirmed for Tomorrow at 08:00 AM.</p>
          <button onClick={() => { setScheduledSuccess(false); setIsScheduling(false); }} className="w-full py-4 rounded-full bg-primary text-primary-foreground font-semibold shadow-glow">
            Done
          </button>
        </div>
      </PhoneFrame>
    );
  }

  if (isScheduling) {
    return (
      <PhoneFrame>
        <div className="min-h-full pb-28 bg-background">
          <AppHeader title="Schedule Ride" onBack={() => setIsScheduling(false)} />
          <div className="px-4 mt-4 space-y-6">
            
            <div className="space-y-3">
              <label className="text-sm font-semibold ml-1">When do you need a ride?</label>
              <div className="flex gap-3">
                 <div className="flex-1 bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-muted-foreground uppercase">Date</div>
                      <input type="date" defaultValue="2026-05-17" className="w-full bg-transparent text-sm font-medium outline-none" />
                    </div>
                 </div>
                 <div className="flex-1 bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-muted-foreground uppercase">Time</div>
                      <input type="time" defaultValue="08:00" className="w-full bg-transparent text-sm font-medium outline-none" />
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold ml-1">Route details</label>
              <div className="bg-card border border-border rounded-3xl p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="w-4 flex justify-center"><Circle className="w-3 h-3 fill-primary text-primary" /></div>
                  <div className="flex-1 border-b border-border pb-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pickup</div>
                    <input type="text" defaultValue="Home" className="w-full bg-transparent text-sm font-medium outline-none mt-1" />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="w-4 flex justify-center"><MapPin className="w-4 h-4 text-primary-glow" /></div>
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Drop-off</div>
                    <input type="text" placeholder="Where to?" defaultValue="Office" className="w-full bg-transparent text-sm font-medium outline-none mt-1" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
               <button onClick={() => setScheduledSuccess(true)} className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-primary text-primary-foreground font-semibold shadow-glow">
                 Confirm Schedule
               </button>
            </div>

          </div>
        </div>
      </PhoneFrame>
    );
  }

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
            {[{d:"Thu · 9:30 PM",from:"Office",to:"Home",p:"Ksh 1,480"},{d:"Sat · 8:00 PM",from:"Home",to:"The Roxy",p:"Ksh 1,850"},{d:"Sun · 10:00 AM",from:"Home",to:"Mom's Brunch",p:"Ksh 1,150"}].map((r)=>(
              <div key={r.d} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center text-primary"><Clock className="w-5 h-5" /></div>
                <div className="flex-1"><div className="text-xs text-muted-foreground">{r.d}</div><div className="text-sm font-semibold">{r.from} → {r.to}</div></div>
                <div className="font-display text-lg">{r.p}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setIsScheduling(true)} className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold shadow-glow"><Plus className="w-4 h-4" /> Schedule new ride</button>
        </div>
        <BottomTabBar />
      </div>
    </PhoneFrame>
  );
}