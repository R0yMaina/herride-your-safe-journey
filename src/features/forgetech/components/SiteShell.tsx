import type { ReactNode } from "react";
import { Navbar, Footer, ScrollProgress } from "./navigation";
import { JsonLd } from "./ui/JsonLd";
import { organisationSchema } from "../seo";

/**
 * The Forgetech marketing site's shell.
 *
 * Everything is inside `.forgetech`, which is where the site's cream/navy/gold
 * tokens and type are scoped — nothing here can leak into the product screens
 * this app also serves.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="forgetech min-h-screen overflow-x-clip">
      {/* Scroll-reveals start at opacity 0 in the server-rendered HTML. If the
          page's JavaScript never runs, nothing would reveal them — so undo the
          hidden state outright when scripting is off. */}
      <noscript>
        <style>{"[data-ft-reveal]{opacity:1!important;transform:none!important}"}</style>
      </noscript>
      <ScrollProgress />
      <Navbar />
      <main id="ft-main" className="pt-16 sm:pt-20">
        {children}
      </main>
      <Footer />
      <JsonLd data={organisationSchema} />
    </div>
  );
}
