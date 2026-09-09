import { SITE } from "./data/site";

interface SeoInput {
  title: string;
  description: string;
  /** Path only, e.g. "/services" — combined with the canonical domain. */
  path: string;
  type?: "website" | "article";
}

/**
 * Per-page metadata for TanStack's `head()`.
 *
 * Canonicals point at `forgetech.ke` rather than at wherever this is being
 * served from, because that is the address the site is meant to be indexed
 * under.
 */
export const seo = ({ title, description, path, type = "website" }: SeoInput) => {
  const fullTitle = path === "/" ? `${SITE.name} — ${SITE.tagline}` : `${title} — ${SITE.name}`;
  const canonical = `${SITE.url}${path === "/" ? "" : path}`;

  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:url", content: canonical },
      { property: "og:site_name", content: SITE.name },
      { property: "og:locale", content: "en_KE" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: canonical }],
  };
};

/** Organisation data, emitted once from the site layout. Only facts we have. */
export const organisationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  slogan: SITE.tagline,
  description:
    "Forgetech is a technology studio in Kenya building websites, AI solutions, business automation and digital products.",
  address: { "@type": "PostalAddress", addressCountry: "KE" },
  sameAs: ["https://instagram.com/forge.tech._", "https://tiktok.com/@forgetechsolutions"],
};
