import type { ReactNode } from "react";
import { AdminNav } from "@/components/navigation/AdminNav";

/**
 * Shell for the admin console — the operator's view of the platform, with
 * its own tab bar (Overview · Drivers · Finance).
 */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-noir">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-2xl" />
      <main className="relative z-10 mx-auto w-full max-w-md flex-1 px-0">{children}</main>
      <AdminNav />
    </div>
  );
}
