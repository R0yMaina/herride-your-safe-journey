import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { MapCanvas } from "@/components/MapCanvas";
import { AppHeader } from "@/components/AppHeader";
import { Circle, MapPin, Lock, Sparkles, Users, Crown } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { DEFAULT_DROP, DEFAULT_PICKUP, getCurrentCoords } from "@/lib/geo";
import { toast } from "sonner";

export const Route = createFileRoute("/book")({
  head: () => ({ meta: [{ title: "Book a ride — HeriRide" }, { name: "description", content: "Choose your ride." }] }),
  component: Book,
});

const tiers = [
  { id: "lite", name: "HerLite", desc: "Quick & affordable", price: 1060, label: "Ksh 1,060", min: "3 min", icon: Sparkles, hot: false },
  { id: "comfort", name: "HerComfort", desc: "Spacious & premium", price: 1600, label: "Ksh 1,600", min: "5 min", icon: Crown, hot: true },
  { id: "share", name: "HerShare", desc: "Split with verified women", price: 660, label: "Ksh 660", min: "7 min", icon: Users, hot: false },
];

function Book() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [selected, setSelected] = useState("comfort");
  const [submitting, setSubmitting] = useState(false);
  const tier = tiers.find((t) => t.id === selected)!;

  const confirm = async () => {
    if (!user) {
      toast.error("Please sign in to book a ride.");
      navigate({ to: "/auth" });
      return;
    }
    setSubmitting(true);
    try {
      const pickup = await getCurrentCoords().catch(() => DEFAULT_PICKUP);
      const { data, error } = await supabase
        .from("rides")
        .insert({
          passenger_id: user.id,
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          pickup_address: "Current location",
          drop_lat: DEFAULT_DROP.lat,
          drop_lng: DEFAULT_DROP.lng,
          drop_address: "Sunset Boulevard, 1402",
          status: "requested",
          fare_estimate: tier.price,
        })
        .select("id")
        .single();
      if (error) throw error;
      navigate({ to: "/matching", search: { rideId: data.id } as never });
    } catch (e: any) {
      toast.error(e.message ?? "Could not create ride");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PhoneFrame>
      <div className="relative min-h-full pb-6">
        <div className="absolute inset-x-0 top-0 h-72">
          <MapCanvas showRoute />
        </div>
        <div className="relative z-10">
          <AppHeader back="/home" sos={false} />
        </div>

        <div className="relative z-10 mt-44 px-4 space-y-4">
          <div className="bg-card border border-border rounded-3xl p-4 shadow-soft">
            <Row icon={<Circle className="w-3 h-3 fill-primary text-primary" />} label="Pickup" value="Campus Library, UCLA" />
            <div className="ml-[7px] my-1 h-5 border-l border-dashed border-border" />
            <Row icon={<MapPin className="w-4 h-4 text-primary-glow" />} label="Drop-off" value="Sunset Boulevard, 1402" />
          </div>

          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Choose your ride</h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-primary/15 text-primary px-2 py-1 rounded-full">
              <Lock className="w-3 h-3" /> Female driver only
            </span>
          </div>

          <div className="space-y-2.5">
            {tiers.map((t) => {
              const Icon = t.icon;
              const active = t.id === selected;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setSelected(t.id)}
                  className={`relative w-full text-left p-4 rounded-2xl border transition ${active ? "border-primary bg-primary/10 shadow-glow" : "border-border bg-card"}`}
                >
                  {active && (
                    <span className="absolute -top-2 left-4 text-[9px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">MOST LOVED</span>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-pink flex items-center justify-center">
                      <Icon className="w-5 h-5 text-noir" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.desc} · {t.min}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg font-semibold">{t.label}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-card border border-border rounded-2xl p-3 flex items-center justify-between">
            <div className="text-xs">
              <div className="text-muted-foreground">Payment</div>
              <div className="font-semibold">Visa •••• 4821</div>
            </div>
            <Link to="/wallet" className="text-xs text-primary font-semibold">Change</Link>
          </div>

          <button
            type="button"
            onClick={confirm}
            disabled={submitting}
            className="block text-center w-full py-4 rounded-full bg-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-60"
          >
            {submitting ? "Requesting ride…" : `Confirm ${tier.name} · ${tier.label}`}
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-4 flex justify-center">{icon}</div>
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}