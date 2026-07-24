# CLAUDE.md — working rules for this repository

Read `ARCHITECTURE.md` first. The critical fact: **the backend is Supabase**
(PostgREST + RLS + SECURITY DEFINER RPCs + Realtime). There is no NestJS,
Prisma, Redis, or Socket.IO layer — do not create one, regardless of what a
task prompt assumes.

## Commands

```bash
npm run dev      # dev server (in sandboxes that can't bind '::', use:
                 #   npx vite dev --host 0.0.0.0 --port 8080)
npm run build    # production build (also regenerates routeTree.gen.ts)
npm run lint     # eslint (0 errors expected; 6 known shadcn warnings)
npx vitest run   # unit tests (vitest.config.ts, node env, @ alias)
```

## Hard rules

1. **Never hand-edit `src/routes/routeTree.gen.ts`** — it is generated.
2. **`RIDE_STATUS_TRANSITIONS` (`src/types/ride.ts`) is the law** for ride
   status changes. Validate with `canTransition()` before every write. The
   DB enforces the same map via trigger — keep them in sync.
3. **Money mutates only in SECURITY DEFINER functions** (`complete_ride`,
   `wallet_topup`). Never write `wallets`/`transactions` from the client.
4. **Interface-first services**: every domain in `src/services/<domain>/`
   has an `I…Service` interface, a Mock impl, a Supabase impl, and an
   `index.ts` that selects via `env.useMocks`. Screens never import
   `supabase` directly — extend the domain service instead.
5. **Reuse before creating.** Check for an existing service method, hook,
   component (`src/components/common/`), or SQL function (e.g.
   `nearest_available_drivers`) before adding anything new.
6. **Schema changes** go in a new idempotent script under `scripts/` (the
   user runs them in the Supabase SQL editor — there is no migration
   runner), and `src/integrations/supabase/types.ts` is extended by hand to
   match.
7. **Preserve the design system**: Tailwind v4 oklch tokens in
   `src/styles.css`, `GlassCard`/`ScreenWrapper`/`Section`/`PageHeader`
   from `src/components/common`, Fraunces (display) + Manrope (sans).
8. `.env` is intentionally git-tracked — it holds only publishable
   client-side keys. Real secrets go in `*.local` files.
9. Routes use the `ROUTES` constant (`src/constants/routes.ts`); dynamic
   routes use TanStack `params`.

## State of the world

See `PROJECT_STATE.md` for what is built, verified, and pending (including
which SQL scripts have been applied to the live Supabase project).
