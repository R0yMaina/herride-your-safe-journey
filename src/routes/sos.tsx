import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppHeader } from "@/components/AppHeader";
import { Phone, Share2, Users, ShieldAlert, CheckCircle2, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export const Route = createFileRoute("/sos")({
  head: () => ({ meta: [{ title: "Emergency — HeriRide" }, { name: "description", content: "SOS support, always on." }] }),
  component: SOS,
});

function SOS() {
  const [holdProgress, setHoldProgress] = useState(0);
  const [isAlerted, setIsAlerted] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const HOLD_DURATION = 3000; // 3 seconds

  const startHolding = () => {
    if (isAlerted) return;
    setIsHolding(true);
    startTimeRef.current = Date.now();
    
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / HOLD_DURATION, 1);
      setHoldProgress(progress);
      
      if (progress >= 1) {
        clearInterval(timerRef.current!);
        setIsAlerted(true);
        setIsHolding(false);
      }
    }, 16);
  };

  const stopHolding = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsHolding(false);
    if (!isAlerted) setHoldProgress(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <PhoneFrame>
      <div className="min-h-full bg-gradient-to-b from-destructive/20 to-background pb-6 relative overflow-hidden">
        <AppHeader back="/trip" sos={false} title="Emergency" />

        <div className="px-6 pt-6 flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            {!isAlerted ? (
              <motion.div 
                key="active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <span className="text-xs uppercase tracking-[0.3em] text-destructive font-semibold mb-2">
                  {isHolding ? `Hold for ${Math.ceil(3 - holdProgress * 3)}s` : "Hold to alert"}
                </span>
                
                <div className="relative my-6 w-64 h-64 flex items-center justify-center">
                  {/* Pulse Effect when not holding */}
                  {!isHolding && [0, 1].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 rounded-full bg-destructive/20"
                      animate={{ scale: [1, 1.25], opacity: [0.5, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.9 }}
                    />
                  ))}

                  {/* Progress Circle Container */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="128"
                      cy="128"
                      r="120"
                      fill="none"
                      stroke="oklch(0.65 0.24 25 / 0.1)"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="128"
                      cy="128"
                      r="120"
                      fill="none"
                      stroke="oklch(0.65 0.24 25)"
                      strokeWidth="8"
                      strokeDasharray="754"
                      strokeDashoffset={754 * (1 - holdProgress)}
                      strokeLinecap="round"
                    />
                  </svg>

                  <button 
                    onMouseDown={startHolding}
                    onMouseUp={stopHolding}
                    onMouseLeave={stopHolding}
                    onTouchStart={startHolding}
                    onTouchEnd={stopHolding}
                    className={`relative w-48 h-48 rounded-full flex flex-col items-center justify-center text-white transition-all duration-300 ${
                      isHolding ? "bg-destructive scale-95" : "bg-destructive shadow-[0_0_60px_oklch(0.65_0.24_25/0.6)]"
                    }`}
                  >
                    <ShieldAlert className={`w-14 h-14 transition-transform duration-300 ${isHolding ? "scale-110" : ""}`} />
                    <span className="font-display text-3xl font-semibold mt-1">SOS</span>
                  </button>
                </div>
                
                <p className="text-sm text-muted-foreground max-w-xs">
                  Alerts your trusted contacts, shares your live location, and notifies HeriRide Safety Team.
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="alerted"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-10"
              >
                <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mb-6">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="font-display text-3xl font-semibold mb-2">Help is on the way</h2>
                <p className="text-muted-foreground mb-8 px-4">
                  Emergency contacts notified. HeriRide Safety Team is currently viewing your live location and audio stream.
                </p>
                
                <div className="bg-noir/40 backdrop-blur rounded-3xl p-6 w-full max-w-sm border border-white/10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Live Stream Active</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-2xl p-3">
                      <div className="text-[10px] uppercase text-muted-foreground mb-1">Police</div>
                      <div className="text-sm font-semibold text-green-500">Dispatched</div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3">
                      <div className="text-[10px] uppercase text-muted-foreground mb-1">Response</div>
                      <div className="text-sm font-semibold">2m 45s</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsAlerted(false)}
                    className="w-full py-3 rounded-xl border border-white/10 text-xs font-semibold hover:bg-white/5 transition-colors"
                  >
                    Cancel Alert (Requires PIN)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isAlerted && (
          <>
            <div className="px-4 mt-8 space-y-2.5">
              <Action icon={Phone} title="Call emergency services" desc="911" tone="destructive" />
              <Action icon={Users} title="Alert trusted contacts" desc="3 contacts on standby" />
              <Action icon={Share2} title="Share live location" desc="Streams for the next 30 minutes" />
            </div>

            <div className="p-4 mt-6">
              <div className="bg-card border border-border rounded-3xl p-4 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Safety pledge:</span> HeriRide responds to every SOS within 60 seconds, 24/7, with a real woman from our safety team.
              </div>
            </div>
          </>
        )}
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