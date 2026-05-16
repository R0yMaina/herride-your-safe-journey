import { createFileRoute } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppHeader } from "@/components/AppHeader";
import { Check, Crown } from "lucide-react";

export const Route = createFileRoute("/subscriptions")({
  head: () => ({ meta: [{ title: "Plans — HerRide" }, { name: "description", content: "Affordable monthly plans." }] }),
  component: Subs,
});

const plans = [
  { n: "HerLite", p: "$19", desc: "Casual commuter", feat: ["10% off all rides","Priority female matching","24/7 SOS"], hot: false },
  { n: "HerPro", p: "$39", desc: "Daily commuter", feat: ["25% off all rides","Free SOS hotline","Scheduled rides","2 free shared rides / wk"], hot: true },
  { n: "HerElite", p: "$79", desc: "Premium lifestyle", feat: ["35% off all rides","Concierge female drivers","Unlimited shared rides","Late-night escort"], hot: false },
];

function Subs() {
  return (
    <PhoneFrame>
      <div className="min-h-full pb-6">
        <AppHeader title="Plans" back="/home" />
        <div className="px-4">
          <div className="text-center px-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary/15 text-primary px-2 py-1 rounded-full uppercase tracking-wider"><Crown className="w-3 h-3" /> Commuter plans</span>
            <h1 className="font-display text-3xl font-semibold mt-3 leading-tight">Affordable. Safe.<br/>Comfortable.</h1>
            <p className="text-sm text-muted-foreground mt-2">Pick a plan made for women on the move.</p>
          </div>
          <div className="space-y-3 mt-6">
            {plans.map((p)=>(
              <div key={p.n} className={`relative rounded-3xl p-5 border ${p.hot?"bg-gradient-pink text-noir border-transparent shadow-glow":"bg-card border-border"}`}>
                {p.hot && <span className="absolute -top-2.5 left-5 text-[10px] font-bold bg-noir text-white px-2.5 py-1 rounded-full uppercase tracking-wider">Most loved</span>}
                <div className="flex items-end justify-between">
                  <div>
                    <div className={`text-xs uppercase tracking-wider ${p.hot?"text-noir/70":"text-muted-foreground"}`}>{p.desc}</div>
                    <div className="font-display text-2xl font-semibold">{p.n}</div>
                  </div>
                  <div className="text-right"><span className="font-display text-3xl font-semibold">{p.p}</span><span className={`text-xs ${p.hot?"text-noir/70":"text-muted-foreground"}`}>/mo</span></div>
                </div>
                <ul className={`mt-4 space-y-1.5 text-sm ${p.hot?"text-noir":""}`}>
                  {p.feat.map((f)=>(<li key={f} className="flex items-start gap-2"><Check className={`w-4 h-4 mt-0.5 ${p.hot?"text-noir":"text-primary"}`} /><span>{f}</span></li>))}
                </ul>
                <button className={`mt-5 w-full py-3 rounded-full text-sm font-semibold ${p.hot?"bg-noir text-white":"bg-primary text-primary-foreground"}`}>Choose {p.n}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}