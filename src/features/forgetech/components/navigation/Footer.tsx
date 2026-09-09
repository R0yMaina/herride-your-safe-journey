import { Link } from "@tanstack/react-router";
import { Container } from "../ui/Container";
import { FOOTER_COLUMNS, SITE, SOCIALS } from "../../data/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ft-line bg-ft-cream-deep">
      <Container>
        <div className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-8">
          <div className="max-w-sm">
            <div className="inline-flex items-baseline gap-[3px] text-[0.95rem] font-extrabold uppercase tracking-[0.2em] text-ft-navy">
              <span>Forgetech</span>
              <span aria-hidden="true" className="size-1 -translate-y-px rounded-full bg-ft-gold" />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ft-navy-soft">{SITE.tagline}</p>
            <p className="mt-6 text-sm text-ft-navy">
              <a href={SITE.url} className="transition-colors hover:text-ft-gold-deep">
                {SITE.domain}
              </a>
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-navy-soft">
                {column.title}
              </h2>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      hash={"hash" in link ? link.hash : undefined}
                      className="text-sm text-ft-navy transition-colors hover:text-ft-gold-deep"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-navy-soft">
              Connect
            </h2>
            <ul className="mt-5 space-y-3">
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group block text-sm text-ft-navy transition-colors hover:text-ft-gold-deep"
                  >
                    {social.label}
                    <span className="block text-xs text-ft-navy-soft">{social.handle}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-ft-line py-7 text-xs text-ft-navy-soft sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.name}. All rights reserved.
          </p>
          <p className="ft-accent text-sm text-ft-navy-soft">{SITE.positioning}</p>
        </div>
      </Container>
    </footer>
  );
}
