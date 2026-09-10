import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { MotionConfig } from "framer-motion";

import appCss from "../styles.css?url";
import { SiteShell } from "@/components/SiteShell";
import { SITE } from "@/data/site";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: `${SITE.name} — ${SITE.tagline}` },
      { name: "theme-color", content: "#0f1a2b" },
      { name: "robots", content: "index, follow" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/icon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400..800&family=Instrument+Serif:ital@0;1&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorView,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    // reducedMotion="user" is what lets every animation on the site skip its
    // own media query — framer applies end states immediately instead.
    <MotionConfig reducedMotion="user">
      <SiteShell>
        <Outlet />
      </SiteShell>
    </MotionConfig>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-gold-deep">
        404
      </span>
      <h1 className="mt-5 text-[2rem] font-bold text-ft-navy sm:text-[2.75rem]">
        That page isn't here.
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-ft-navy-soft">
        The link may be out of date, or the page may have moved. Everything we've published is one
        click away.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-ft-navy px-6 py-3 text-sm font-semibold text-ft-cream transition-transform duration-200 hover:-translate-y-px"
      >
        Back to the homepage
      </Link>
    </div>
  );
}

function ErrorView({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-[1.75rem] font-bold text-ft-navy sm:text-[2.25rem]">
        This page didn't load.
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-ft-navy-soft">
        Something broke on our end. Trying again usually works — if it doesn't, we'd like to know.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="rounded-full bg-ft-navy px-6 py-3 text-sm font-semibold text-ft-cream transition-transform duration-200 hover:-translate-y-px"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-full border border-ft-navy/25 px-6 py-3 text-sm font-semibold text-ft-navy transition-colors hover:border-ft-navy"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
