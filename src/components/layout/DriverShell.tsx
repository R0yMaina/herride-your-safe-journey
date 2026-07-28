import type { ReactNode } from "react";
import { DriverNav } from "@/components/navigation/DriverNav";

/**
 * Shell for the driver app. Same canvas as the rider shell but with the
 * driver's own tab bar — one codebase, two experiences that never mix.
 */
export function DriverShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-noir">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-2xl" />
      <main className="relative z-10 mx-auto w-full max-w-md flex-1 px-0">{children}</main>
      <DriverNav />
    </div>
  );
}
