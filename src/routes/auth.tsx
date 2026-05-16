import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { ShieldCheck, Sparkles, Phone } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — HerRide" },
      { name: "description", content: "Sign in to HerRide. Verified women only." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  return (
    <PhoneFrame>
      <div className="relative min-h-full flex flex-col">
        <div className="relative h-64 bg-gradient-pink overflow-hidden">
          <div className="absolute inset-0 bg-noir/30" />
          <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-primary-glow/40 blur-3xl" />
          <div className="relative z-10 h-full flex flex-col justify-end p-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-noir/40 backdrop-blur text-white px-3 py-1.5 rounded-full w-fit">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Women Only
            </span>
            <h1 className="font-display text-4xl font-semibold text-noir mt-3">Welcome to HerRide</h1>
            <p className="text-noir/70 text-sm mt-1">Your trusted ride home.</p>
          </div>
        </div>

        <div className="flex-1 px-6 -mt-6 relative z-10">
          <div className="bg-card border border-border rounded-3xl p-5 shadow-soft">
            <div className="flex bg-secondary rounded-full p-1 mb-5">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all ${
                    mode === m ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground"
                  }`}
                >
                  {m === "login" ? "Log in" : "Sign up"}
                </button>
              ))}
            </div>

            {mode === "signup" && (
              <Field label="Full name" placeholder="Jane Doe" />
            )}
            <Field label="Phone number" placeholder="+1 (555) 010-4242" icon={<Phone className="w-4 h-4" />} />
            <button className="mt-2 w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold shadow-glow">
              Send verification code
            </button>
            <p className="text-[11px] text-muted-foreground mt-3 text-center leading-relaxed">
              By continuing you confirm you identify as a woman and accept our Community Safety Pledge.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-5">
            {[
              { t: "Verified", d: "Background-checked" },
              { t: "Female", d: "Drivers & riders" },
              { t: "24/7 SOS", d: "Always on" },
            ].map((p) => (
              <div key={p.t} className="bg-card border border-border rounded-2xl p-3 text-center">
                <Sparkles className="w-4 h-4 text-primary mx-auto" />
                <div className="text-xs font-semibold mt-1">{p.t}</div>
                <div className="text-[10px] text-muted-foreground">{p.d}</div>
              </div>
            ))}
          </div>

          <Link to="/home" className="block text-center text-xs text-primary mt-6 mb-8 font-semibold">
            Skip to demo →
          </Link>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Field({ label, placeholder, icon }: { label: string; placeholder: string; icon?: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <div className="mt-1.5 flex items-center gap-2 bg-secondary border border-border rounded-2xl px-4 py-3">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <input className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground" placeholder={placeholder} />
      </div>
    </label>
  );
}