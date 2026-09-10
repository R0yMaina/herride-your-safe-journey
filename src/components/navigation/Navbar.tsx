import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { FT_ROUTES, NAV_LINKS } from "../../data/site";
import { Wordmark } from "./Wordmark";
import { MobileMenu } from "./MobileMenu";

/** Sticky header. Transparent over the top of the page, then a cream bar with
 *  a hairline once the visitor has scrolled — the only change it makes. */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A route change while the panel is open would otherwise leave it up.
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      <a
        href="#ft-main"
        className="sr-only rounded-full bg-ft-navy px-4 py-2 text-sm font-semibold text-ft-cream focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70]"
      >
        Skip to content
      </a>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
          scrolled
            ? "border-b border-ft-line bg-ft-cream backdrop-blur-md supports-[backdrop-filter]:bg-ft-cream/92"
            : "border-b border-transparent",
        )}
      >
        <Container>
          <div className="flex h-16 items-center justify-between gap-6 sm:h-20">
            <Wordmark />

            <nav aria-label="Primary" className="hidden lg:block">
              <ul className="flex items-center gap-8">
                {NAV_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      activeOptions={{ exact: link.to === FT_ROUTES.home }}
                      activeProps={{ className: "text-ft-navy after:scale-x-100" }}
                      inactiveProps={{ className: "text-ft-navy-soft" }}
                      className={cn(
                        "relative py-1 text-sm font-medium transition-colors hover:text-ft-navy",
                        "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left",
                        "after:scale-x-0 after:bg-ft-gold after:transition-transform after:duration-300",
                        "hover:after:scale-x-100",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="hidden lg:block">
              <Button to={FT_ROUTES.contact} className="px-5 py-2.5">
                Start a Project
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="ft-mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="relative z-[55] -mr-2 flex size-11 items-center justify-center lg:hidden"
            >
              <span className="relative block h-3 w-6">
                <span
                  className={cn(
                    "absolute inset-x-0 top-0 h-px bg-ft-navy transition-transform duration-300",
                    menuOpen && "translate-y-[6px] rotate-45",
                  )}
                />
                <span
                  className={cn(
                    "absolute inset-x-0 bottom-0 h-px bg-ft-navy transition-transform duration-300",
                    menuOpen && "-translate-y-[6px] -rotate-45",
                  )}
                />
              </span>
            </button>
          </div>
        </Container>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
