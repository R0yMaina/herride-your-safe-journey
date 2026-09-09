/**
 * Generates the Forgetech site's sitemap.xml and robots.txt from the same
 * route and content data the site renders, so they cannot drift out of sync.
 *
 *   node scripts/forgetech-sitemap.mjs
 *
 * The URLs are written against https://forgetech.ke, which is what the pages'
 * canonical tags point at. Output lands in `public/forgetech/`; when the site
 * is deployed on its own domain both files belong at the document root.
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const ORIGIN = "https://forgetech.ke";
const OUT_DIR = resolve(root, "public/forgetech");

/** Pull the slugs out of a data module without importing TypeScript. */
const slugsFrom = (relativePath) => {
  const source = readFileSync(resolve(root, relativePath), "utf8");
  return [...source.matchAll(/^\s{4}slug:\s*"([^"]+)"/gm)].map((match) => match[1]);
};

const work = slugsFrom("src/features/forgetech/data/projects.ts");
const insights = slugsFrom("src/features/forgetech/data/insights.ts");

const pages = [
  { path: "/", priority: "1.0", changefreq: "monthly" },
  { path: "/services", priority: "0.9", changefreq: "monthly" },
  { path: "/work", priority: "0.9", changefreq: "monthly" },
  { path: "/process", priority: "0.7", changefreq: "yearly" },
  { path: "/about", priority: "0.7", changefreq: "yearly" },
  { path: "/insights", priority: "0.8", changefreq: "weekly" },
  { path: "/contact", priority: "0.8", changefreq: "yearly" },
  ...work.map((slug) => ({ path: `/work/${slug}`, priority: "0.7", changefreq: "monthly" })),
  ...insights.map((slug) => ({ path: `/insights/${slug}`, priority: "0.6", changefreq: "yearly" })),
];

const today = new Date().toISOString().slice(0, 10);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    ({ path, priority, changefreq }) => `  <url>
    <loc>${ORIGIN}${path === "/" ? "/" : path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

const robots = `# ${ORIGIN}
User-agent: *
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(resolve(OUT_DIR, "sitemap.xml"), sitemap);
writeFileSync(resolve(OUT_DIR, "robots.txt"), robots);

console.log(`Wrote ${pages.length} URLs to public/forgetech/sitemap.xml and robots.txt`);
