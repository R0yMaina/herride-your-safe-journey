import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export function UnauthorizedScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-noir px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-destructive/15 text-destructive">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="font-display text-3xl text-foreground">Access restricted</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your account does not have permission to view this area. If you think this is a mistake,
        contact HeRide support.
      </p>
      <Link
        to={ROUTES.home}
        className="mt-2 rounded-full bg-gradient-pink px-6 py-3 text-sm font-semibold text-noir shadow-glow"
      >
        Back to home
      </Link>
    </div>
  );
}