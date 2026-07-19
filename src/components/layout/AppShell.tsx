import type { ReactNode } from "react";
import { BottomNav } from "@/components/navigation/BottomNav";

/**
 * Global shell for the authenticated app surface. Renders route content
 * inside a scrollable, premium canvas and mounts persistent chrome (nav,
 * safe-area gutters). Feature routes stay presentational.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-noir">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-2xl" />
      <main className="relative z-10 mx-auto w-full max-w-md flex-1 px-0">{children}</main>
      <BottomNav />
    </div>
  );
}
