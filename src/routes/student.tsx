import { createFileRoute } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppHeader } from "@/components/AppHeader";
import { GraduationCap, Sparkles, Mail } from "lucide-react";

export const Route = createFileRoute("/student")({
  head: () => ({ meta: [{ title: "Student — HerRide" }, { name: "description", content: "20% off for verified students." }] }),
  component: Student,
});

const unis = ["UCLA","NYU","Stanford","USC","Columbia","Berkeley","Boston U.","Yale"];

function Student() {
  return (
    <PhoneFrame>
      <div className="min-h-full pb-6">
        <AppHeader title="Student" back="/home" />
        <div className="px-4">
          <div className="relative rounded-3xl bg-gradient-pink p-6 text-noir overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/30 blur-3xl" />
            <div className="relative">
              <GraduationCap className="w-10 h-10" />
              <div className="font-display text-5xl font-semibold mt-3 leading-none">20% off<br/>every ride</div>
              <p className="text-sm mt-3 opacity-80 max-w-[260px]">For verified female university students. Safer late-night campus runs, on us.</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-3xl p-5 mt-4">
            <div className="flex items-center gap-2 text-xs text-primary font-semibold uppercase tracking-wider"><Sparkles className="w-4 h-4" /> Step 1</div>
            <h2 className="font-display text-lg font-semibold mt-1">Verify your .edu email</h2>
            <div className="mt-3 flex items-center gap-2 bg-secondary border border-border rounded-2xl px-4 py-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <input placeholder="you@university.edu" className="flex-1 bg-transparent outline-none text-sm" />
            </div>
            <button className="mt-3 w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold shadow-glow">Send verification</button>
          </div>
          <h2 className="font-display text-lg font-semibold mt-6 mb-2">Partner universities</h2>
          <div className="flex flex-wrap gap-2">{unis.map((u)=>(<span key={u} className="px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium">{u}</span>))}</div>
          <div className="mt-6 bg-card border border-border rounded-3xl p-5 text-center">
            <div className="font-display italic text-primary">"Safer campus nights, every night."</div>
            <div className="text-xs text-muted-foreground mt-1">— Lina, UCLA '26</div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}