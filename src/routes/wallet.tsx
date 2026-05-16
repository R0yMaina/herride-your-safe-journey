import { createFileRoute } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppHeader } from "@/components/AppHeader";
import { BottomTabBar } from "@/components/BottomTabBar";
import { Plus, CreditCard, Apple, Wallet as WalletIcon } from "lucide-react";

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [{ title: "Wallet — HerRide" }, { name: "description", content: "Manage payments." }] }),
  component: Wallet,
});

function Method({ icon: Icon, title, sub, badge }: { icon: any; title: string; sub: string; badge?: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl">
      <div className="w-11 h-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center"><Icon className="w-5 h-5" /></div>
      <div className="flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      {badge && <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-1 rounded-full">{badge}</span>}
    </div>
  );
}

function Wallet() {
  return (
    <PhoneFrame>
      <div className="min-h-full pb-28">
        <AppHeader title="Wallet" back="/home" sos={false} />
        <div className="px-4">
          <div className="relative rounded-3xl p-5 bg-gradient-pink text-noir overflow-hidden shadow-soft">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/30 blur-2xl" />
            <div className="relative">
              <div className="text-xs uppercase tracking-wider font-semibold">HerRide balance</div>
              <div className="font-display text-5xl font-semibold mt-2">$42.80</div>
              <div className="text-xs opacity-70 mt-1">+ $5 student bonus this week</div>
              <div className="flex gap-2 mt-5">
                <button className="flex-1 py-2.5 rounded-full bg-noir text-white text-sm font-semibold">Top up</button>
                <button className="flex-1 py-2.5 rounded-full bg-white/90 text-noir text-sm font-semibold">Send</button>
              </div>
            </div>
          </div>
          <h2 className="font-display text-lg font-semibold mt-6 mb-2">Payment methods</h2>
          <div className="space-y-2">
            <Method icon={CreditCard} title="Visa •••• 4821" sub="Expires 08/28" badge="Default" />
            <Method icon={Apple} title="Apple Pay" sub="Linked to iPhone" />
            <Method icon={WalletIcon} title="HerRide Wallet" sub="2% cashback every ride" />
            <button className="w-full flex items-center gap-3 p-4 rounded-2xl border border-dashed border-border text-primary text-sm font-semibold">
              <Plus className="w-4 h-4" /> Add payment method
            </button>
          </div>
          <h2 className="font-display text-lg font-semibold mt-6 mb-2">Recent rides</h2>
          <div className="bg-card border border-border rounded-3xl divide-y divide-border">
            {[{d:"Tonight 9:42 PM",to:"Sunset Blvd",a:"$12.40"},{d:"Tue 8:10 AM",to:"UCLA Campus",a:"$6.80"},{d:"Mon 11:30 PM",to:"Home",a:"$9.20"}].map((r)=>(
              <div key={r.d} className="flex items-center justify-between p-4">
                <div><div className="text-sm font-semibold">{r.to}</div><div className="text-xs text-muted-foreground">{r.d}</div></div>
                <div className="font-display text-lg">{r.a}</div>
              </div>
            ))}
          </div>
        </div>
        <BottomTabBar />
      </div>
    </PhoneFrame>
  );
}