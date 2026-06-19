import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PhoneFrame } from "@/components/PhoneFrame";
import { MapCanvas } from "@/components/MapCanvas";
import { ShieldCheck, BadgeCheck, Venus } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const searchSchema = z.object({ rideId: z.string().uuid().optional() });

export const Route = createFileRoute("/matching")({
  head: () => ({ meta: [{ title: "Matching — HeriRide" }, { name: "description", content: "Matching you with a verified female driver." }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: Matching,
});

function Matching() {
  const { rideId } = Route.useSearch();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>("requested");

  useEffect(() => {
    if (!rideId) return;
    let cancelled = false;

    const check = (s: string, driverId: string | null) => {
      setStatus(s);
      if (driverId && (s === "accepted" || s === "matched" || s === "arrived" || s === "in_progress")) {
        navigate({ to: "/trip", search: { rideId } as never });
      }
    };

    supabase
      .from("rides")
      .select("status, driver_id")
      .eq("id", rideId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) check(data.status, data.driver_id);
      });

    const channel = supabase
      .channel(`ride:${rideId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${rideId}` },
        (payload) => {
          const r = payload.new as { status: string; driver_id: string | null };
          check(r.status, r.driver_id);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [rideId, navigate]);

  return (
    <PhoneFrame>
      <div className="relative min-h-full flex flex-col">
        <div className="absolute inset-0">
          <MapCanvas />
          <div className="absolute inset-0 bg-noir/60" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-primary"
                animate={{ scale: [0.6, 1.4], opacity: [0.6, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.7, ease: "easeOut" }}
              />
            ))}
            <div className="w-28 h-28 rounded-full bg-gradient-pink p-1 shadow-glow">
              <div className="w-full h-full rounded-full bg-noir flex items-center justify-center">
                <Venus className="w-12 h-12 text-primary" />
              </div>
            </div>
          </div>

          <h1 className="font-display text-2xl font-semibold mt-8 text-center">Finding your driver</h1>
          <p className="text-sm text-muted-foreground mt-2 text-center max-w-xs">
            {rideId
              ? status === "requested"
                ? "Pinging verified female drivers near you…"
                : `Ride ${status.replace("_", " ")}`
              : "No active ride. Book one to start matching."}
          </p>

          <div className="grid grid-cols-3 gap-2 mt-8 w-full max-w-sm">
            {[
              { i: Venus, l: "Female" },
              { i: BadgeCheck, l: "Verified" },
              { i: ShieldCheck, l: "Vetted" },
            ].map(({ i: Icon, l }) => (
              <div key={l} className="bg-card/80 backdrop-blur border border-border rounded-2xl py-3 flex flex-col items-center gap-1">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-[11px] font-medium">{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 p-4">
          {rideId ? (
            <Link
              to="/trip"
              search={{ rideId } as never}
              className="block w-full text-center py-3.5 rounded-full bg-card border border-border text-sm font-semibold"
            >
              View live trip →
            </Link>
          ) : (
            <Link to="/book" className="block w-full text-center py-3.5 rounded-full bg-card border border-border text-sm font-semibold">
              Book a ride →
            </Link>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}