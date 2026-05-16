import { Link } from "@tanstack/react-router";
import { ChevronLeft, ShieldAlert } from "lucide-react";

export function AppHeader({ title, back = "/home", sos = true }: { title?: string; back?: string; sos?: boolean }) {
  return (
    <div className="sticky top-0 z-20 px-4 pt-4 pb-3 bg-background/80 backdrop-blur-xl flex items-center justify-between">
      <Link to={back} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
        <ChevronLeft className="w-5 h-5" />
      </Link>
      {title && <h1 className="font-display text-lg font-semibold">{title}</h1>}
      {sos ? (
        <Link to="/sos" className="w-10 h-10 rounded-full bg-destructive/15 text-destructive flex items-center justify-center">
          <ShieldAlert className="w-5 h-5" />
        </Link>
      ) : (
        <span className="w-10" />
      )}
    </div>
  );
}