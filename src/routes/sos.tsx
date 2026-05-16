import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppHeader } from "@/components/AppHeader";
import { Phone, Share2, Users, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/sos")({
  head: () => ({ meta: [{ title: "Emergency — HerRide" }, { name: "description", content: "SOS support, always on." }] }),
  component: SOS,
});

function SOS() {
  return (
    <PhoneFrame>
      <div className="min-h-full bg-gradient-to-b from-destructive/20 to-background pb-6">
        <AppHeader back="/trip" sos={false} title="Emergency" />

        <div className="px-6 pt-6 flex flex-col items-center text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-destructive font-semibold">Hold to alert</span>
          <div className="relative my-6 w-56 h-56 flex items-center justify-center">
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full bg-destructive/20"
                animate={{ scale: [1, 1.25], opacity: [0.5, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.9 }}
              />
            ))}
            <button className="relative w-44 h-44 rounded-full bg-destructive flex flex-col items-center justify-center text-white shadow-[0_0_60px_oklch(0.65_0.24_25/0.6)]">
              <ShieldAlert className="w-12 h-12" />
              <span className="font-display text-2xl font-semibold mt-1">SOS</span>
            </button>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Alerts your trusted contacts, shares your live location, and notifies HerRide Safety Team.
          </p>
        </div>

        <div className="px-4 mt-8 space-y-2.5">
          <Action icon={Phone} title="Call emergency services" desc="911" tone="destructive" />
          <Action icon={Users} title="Alert trusted contacts" desc="3 contacts on standby" />
          <Action icon={Share2} title="Share live location" desc="Streams for the next 30 minutes" />
        </div>

        <div className="p-4 mt-6">
          <div className="bg-card border border-border rounded-3xl p-4 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Safety pledge:</span> HerRide responds to every SOS within 60 seconds, 24/7, with a real woman from our safety team.
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Action({ icon: Icon, title, desc, tone }: { icon: any; title: string; desc: string; tone?: "destructive" }) {
  const isDanger = tone === "destructive";
  return (
    <button className={`w-full flex items-center gap-3 p-4 rounded-2xl border ${isDanger ? "bg-destructive/10 border-destructive/30" : "bg-card border-border"}`}>
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isDanger ? "bg-destructive text-white" : "bg-primary/15 text-primary"}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 text-left">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </button>
  );
}