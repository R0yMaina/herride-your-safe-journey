import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteShell } from "@/features/forgetech/components/SiteShell";

export const Route = createFileRoute("/forgetech")({
  head: () => ({
    links: [
      // The editorial accent face. Manrope is already loaded app-wide by the
      // root route, so this is the only extra font request the site makes.
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap",
      },
    ],
    meta: [{ name: "theme-color", content: "#0f1a2b" }],
  }),
  component: ForgetechLayout,
});

function ForgetechLayout() {
  return (
    <SiteShell>
      <Outlet />
    </SiteShell>
  );
}
