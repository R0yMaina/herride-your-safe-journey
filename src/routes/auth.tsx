import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { ShieldCheck, Sparkles, Mail, Lock, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { HeriRideLogo } from "@/components/HeriRideLogo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — HeriRide" },
      { name: "description", content: "Sign in to HeriRide. Verified women only." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"female" | "other">("female");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home" });
    });
  }, [navigate]);

  const handleAuth = async () => {
    if (!email || !password) {
      toast.error("Enter your email and password");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        if (gender !== "female") {
          toast.error("HerRide is reserved for female passengers.");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
            data: { full_name: fullName, gender },
          },
        });
        if (error) throw error;
        toast.success("Account created — check your email to verify.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/home" });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/home",
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/home" });
  };

  return (
    <PhoneFrame>
      <div className="relative min-h-full flex flex-col">
        <div className="relative h-64 bg-gradient-pink overflow-hidden">
          <div className="absolute inset-0 bg-noir/30" />
          <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-primary-glow/40 blur-3xl" />
          <div className="relative z-10 h-full flex flex-col justify-end p-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-noir/40 backdrop-blur text-white px-3 py-1.5 rounded-full w-fit">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Women Only
              </span>
              <HeriRideLogo size={50} showBackground={false} className="opacity-90 filter drop-shadow-sm" />
            </div>
            <h1 className="font-display text-4xl font-semibold text-noir mt-3">Welcome to HeriRide</h1>
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
              <Field label="Full name" placeholder="Jane Doe" icon={<UserIcon className="w-4 h-4" />} value={fullName} onChange={setFullName} />
            )}
            <Field label="Email" placeholder="you@example.com" icon={<Mail className="w-4 h-4" />} value={email} onChange={setEmail} type="email" />
            <Field label="Password" placeholder="••••••••" icon={<Lock className="w-4 h-4" />} value={password} onChange={setPassword} type="password" />
            {mode === "signup" && (
              <div className="mb-3">
                <span className="text-xs text-muted-foreground font-medium">I identify as</span>
                <div className="mt-1.5 flex gap-2">
                  {(["female", "other"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold border transition-all ${
                        gender === g ? "bg-primary text-primary-foreground border-primary shadow-glow" : "bg-secondary border-border text-muted-foreground"
                      }`}
                    >
                      {g === "female" ? "Woman" : "Other"}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={handleAuth}
              disabled={loading}
              className="mt-2 w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-60"
            >
              {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
            </button>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full py-3 rounded-full bg-card border border-border font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 7.9-21l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12c3 0 5.7 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5A20 20 0 0 0 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.3 0-1.3-.1-2.7-.4-4z"/></svg>
              Continue with Google
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

          <Link to="/onboarding" className="block text-center text-xs text-primary mt-6 mb-8 font-semibold">
            Skip to demo →
          </Link>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Field({ label, placeholder, icon, value, onChange, type = "text" }: { label: string; placeholder: string; icon?: React.ReactNode; value?: string; onChange?: (v: string) => void; type?: string }) {
  return (
    <label className="block mb-3">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <div className="mt-1.5 flex items-center gap-2 bg-secondary border border-border rounded-2xl px-4 py-3">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
          placeholder={placeholder}
        />
      </div>
    </label>
  );
}