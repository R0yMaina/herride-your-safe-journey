import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "../ui/Button";
import { FT_ROUTES, NAV_LINKS, SOCIALS } from "../../data/site";

/**
 * Full-screen mobile navigation. Deliberately not a scaled-down desktop bar:
 * the links are set large enough to hit accurately with a thumb, and the panel
 * traps nothing — it closes on Escape, on navigation and on the toggle.
 */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Stop the page behind the panel from scrolling with it.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="ft-mobile-menu"
          className="fixed inset-0 z-50 flex flex-col bg-ft-cream lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <nav aria-label="Site" className="flex flex-1 flex-col justify-center px-6 pb-10 pt-24">
            <ul className="space-y-1">
              {NAV_LINKS.map((link, index) => (
                <motion.li
                  key={link.to}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * index + 0.05, duration: 0.3, ease: "easeOut" }}
                >
                  <Link
                    to={link.to}
                    onClick={onClose}
                    activeOptions={{ exact: link.to === FT_ROUTES.home }}
                    activeProps={{ className: "text-ft-gold-deep" }}
                    className="block border-b border-ft-line/70 py-4 text-[1.75rem] font-bold tracking-tight text-ft-navy"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34, duration: 0.3 }}
              className="mt-10"
            >
              <Button to={FT_ROUTES.contact} className="w-full" arrow>
                Start a Project
              </Button>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ft-navy-soft">
                {SOCIALS.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="hover:text-ft-navy"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
