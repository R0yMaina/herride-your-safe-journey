# forgetech.ke

The Forgetech studio website. Nine pages — homepage, services, work and case
studies, process, the Forgetech Brief, about, and a project-brief contact form.

Built with React 19, TypeScript, Tailwind v4 and Framer Motion on TanStack
Start, server-rendered, deployed to Cloudflare Workers.

## Commands

```bash
npm install
npm run dev        # dev server on :8080 (0.0.0.0)
npm run build      # production build → dist/
npm run preview    # serve the build
npm run lint       # eslint (0 errors, 0 warnings expected)
npm test           # vitest — content rules and form validation
npm run sitemap    # regenerate public/sitemap.xml and public/robots.txt
npm run deploy     # wrangler deploy (needs Cloudflare auth)
```

## Deploying

The site deploys to **Cloudflare Workers**. `vite build` emits the Worker to
`dist/server/` (with a generated `wrangler.json`) and static assets to
`dist/client/`.

**Cloudflare Workers Builds** (connected to this repo):

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy -c dist/server/wrangler.json` |
| Root directory | `/` |

Add the two `VITE_SUPABASE_*` values below as build-time environment variables
in the Cloudflare project — Vite inlines them at build time, so they must be
present when Cloudflare builds, not only at runtime.

To deploy by hand instead: `npx wrangler login && npm run build && npm run deploy`.

Point `forgetech.ke` at the Worker under **Workers & Pages → the worker →
Settings → Domains & Routes → Add custom domain**.

## Environment

`.env` is tracked on purpose: it holds only publishable, client-side keys.
Real secrets belong in `*.local` files, which `.gitignore` excludes.

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project the contact form writes to |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) key for the same |
| `VITE_USE_MOCKS` | `true` runs the contact form against an in-memory mock |

## The contact form

`/contact` writes a project brief to a Supabase table. **Run
`scripts/project-briefs.sql` in the Supabase SQL editor before launch** — until
that table exists, submissions fail and the form tells the visitor so rather
than reporting a false success.

The policies are deliberately asymmetric: anyone (including anonymous visitors)
may INSERT, only admins may SELECT. Enquiries contain someone's name, email and
a description of their business; no visitor can read them back.

Development without a backend: set `VITE_USE_MOCKS=true` in `.env.local`.

## Editing the site

Content is separated from the interface. Everything a non-developer would want
to change lives in `src/data/`:

| File | What it holds |
| --- | --- |
| `site.ts` | Brand facts, navigation, social handles |
| `services.ts` | The four services, in card and full-page depth |
| `projects.ts` | Case studies |
| `insights.ts` | Articles for the Brief |
| `process.ts`, `principles.ts`, `problems.ts`, `technologies.ts` | The homepage sections |

**Never add a client name, metric, testimonial, award or case-study outcome
that has not actually happened.** `outcome` is nullable and the case-study page
states plainly that results are published only once measured; a test enforces
it. That honesty is the reason the work reads as credible.

After editing `projects.ts` or `insights.ts`, run `npm run sitemap`.

## Layout

```
src/
  routes/       file-based routes (one per page) + the root shell
  pages/        the page bodies
  components/   ui/ navigation/ sections/ cards/ forms/
  data/         all content
  services/     project-briefs (interface + mock + Supabase impl)
  seo.ts        per-page metadata and the Organization schema
  styles.css    the design system: --ft-* tokens, scoped to .forgetech
```

Design: warm cream canvas, deep navy type, warm gold as an accent only.
Manrope for text, Instrument Serif italic for editorial accents. Every
foreground/background pair in the palette clears WCAG AA.
