import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppHeader } from "@/components/AppHeader";
import { Star } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/ratings")({
  head: () => ({ meta: [{ title: "Rate ride — HerRide" }, { name: "description", content: "Rate your driver." }] }),
  component: Ratings,
});

const tags = ["Felt safe", "Friendly", "Clean car", "Smooth drive", "On time", "Great vibe"];

function Ratings() {
  const [r, setR] = useState(5);
  const [picked, setPicked] = useState<string[]>(["Felt safe", "Friendly"]);
  return (
    <PhoneFrame>
      <div className="min-h-full pb-6">
        <AppHeader back="/trip" sos={false} title="Rate your ride" />
        <div className="px-6 text-center mt-2">
          <div className="w-24 h-24 rounded-full bg-gradient-pink p-0.5 mx-auto">
            <div className="w-full h-full rounded-full bg-noir flex items-center justify-center font-display text-3xl text-primary">M</div>
          </div>
          <h2 className="font-display text-2xl font-semibold mt-3">How was Maria?</h2>
          <p className="text-sm text-muted-foreground">Pink Tesla Model 3 · 12 min trip</p>
          <div className="flex justify-center gap-2 mt-6">
            {[1,2,3,4,5].map((i)=>(
              <button key={i} onClick={()=>setR(i)}>
                <Star className={`w-9 h-9 ${i<=r?"fill-primary text-primary":"text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {tags.map((t)=>{const on=picked.includes(t);return(
              <button key={t} onClick={()=>setPicked((p)=>on?p.filter(x=>x!==t):[...p,t])}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${on?"bg-primary text-primary-foreground border-primary shadow-glow":"bg-card text-muted-foreground border-border"}`}>{t}</button>
            );})}
          </div>
          <textarea placeholder="Leave a note for Maria (optional)" className="mt-5 w-full h-24 bg-card border border-border rounded-2xl p-3 text-sm outline-none placeholder:text-muted-foreground resize-none" />
          <Link to="/favorites" className="mt-4 block w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold shadow-glow">Submit & save Maria</Link>
          <Link to="/home" className="block text-xs text-muted-foreground mt-3">Maybe later</Link>
        </div>
      </div>
    </PhoneFrame>
  );
}