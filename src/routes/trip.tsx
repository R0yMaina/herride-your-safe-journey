import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { MapCanvas } from "@/components/MapCanvas";
import { AppHeader } from "@/components/AppHeader";
import { MessageCircle, Share2, ShieldAlert, Phone, Star } from "lucide-react";

export const Route = createFileRoute("/trip")({
  head: () => ({ meta: [{ title: "Live trip — HeriRide" }, { name: "description", content: "Track your ride in real time." }] }),
  component: Trip,
});

function Trip() {
  return (
    <PhoneFrame>
      <div className="relative min-h-full">
        <div className="absolute inset-0">
          <MapCanvas showRoute />
        </div>
        <div className="relative z-10">
          <AppHeader back="/home" sos />
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 p-3">
          <div className="bg-card/95 backdrop-blur-xl border border-border rounded-3xl p-5 shadow-soft">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Arriving in</span>
              <span className="text-xs text-primary font-semibold">On the way</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="font-display text-4xl font-semibold">8 <span className="text-base font-normal text-muted-foreground">min</span></div>
              <div className="text-right text-xs">
                <div className="text-muted-foreground">ETA</div>
                <div className="font-semibold">9:42 PM</div>
              </div>
            </div>

            <div className="my-4 h-px bg-border" />

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-pink p-0.5">
                <div className="w-full h-full rounded-full bg-noir flex items-center justify-center font-display text-xl text-primary">M</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold">Maria L.</span>
                  <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                  <span className="text-xs">4.98</span>
                </div>
                <div className="text-xs text-muted-foreground">Pink Tesla Model 3 · GLOW 224</div>
              </div>
              <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"><MessageCircle className="w-4 h-4" /></button>
              <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"><Phone className="w-4 h-4 text-primary-foreground" /></button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Link to="/share-trip" className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-secondary border border-border text-sm font-semibold">
                <Share2 className="w-4 h-4 text-primary" /> Share trip
              </Link>
              <Link to="/sos" className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive text-sm font-semibold">
                <ShieldAlert className="w-4 h-4" /> SOS
              </Link>
            </div>

            <Link to="/ratings" className="block text-center mt-3 text-xs text-primary font-semibold">Trip ended? Rate Maria →</Link>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}