# HeRide Architecture

**Read this before writing any code.** It describes the architecture that
actually exists in this repository — not an aspirational one.

## The one thing to understand first

**There is no NestJS / Prisma / Redis / Socket.IO backend. The backend is
Supabase.** Any instruction that assumes a Node API server, an ORM layer, a
Redis cluster, or a custom websocket gateway does not apply here and must be
re-interpreted against the real stack below. Do not fabricate those layers —
that would create a parallel implementation of capabilities Supabase already
provides.

| Concern | Provided by |
| --- | --- |
| HTTP API | Supabase PostgREST (auto-generated, RLS-enforced) |
| Websockets / real-time events | Supabase Realtime (`postgres_changes` over Phoenix websockets) |
| Auth + JWT + session refresh | Supabase Auth (`@supabase/supabase-js`) |
| Authorization | Postgres Row-Level Security policies |
| Business-critical mutations | `SECURITY DEFINER` SQL functions (RPCs) |
| Presence / driver availability | `driver_locations` table (+ realtime publication) |
| Scheduled jobs | `pg_cron` (see `scripts/phase7-dispatch.sql`) |
| Shared state for horizontal scaling | Postgres itself — the client tier is stateless |

## Frontend stack

- **TanStack Start** (React 19, SSR) with **file-based routes** in
  `src/routes/`. `src/routes/routeTree.gen.ts` is **generated — never edit
  it by hand**; it regenerates on `npm run dev` / `npm run build`.
- **Zustand** — one store per concern in `src/store/` (auth, theme,
  onboarding, ride-request). No god-store.
- **TanStack Query** for server-state caching, **react-hook-form + zod** for
  forms, **Tailwind v4** (oklch tokens in `src/styles.css`), **shadcn/ui**
  primitives in `src/components/ui/`, **framer-motion** (wrapped in
  `MotionConfig reducedMotion="user"`).
- Composition root: `src/routes/__root.tsx` (providers, fonts, auth
  bootstrap). `initAuthSync()` reconciles Supabase's persisted session with
  the auth store on the client.

## Service layer (the load-bearing convention)

Every domain lives in `src/services/<domain>/` as:

```
<domain>.service.ts            # I<Domain>Service interface + Mock impl
supabase-<domain>.service.ts   # Real implementation
index.ts                       # picks Mock vs Supabase via env.useMocks
```

Screens import **only** the selected singleton (e.g. `driverService`) and the
interface types. `VITE_USE_MOCKS=true` runs the whole app on mocks; default
is real. **Never let a screen talk to `supabase` directly** — add a method to
the domain service.

Domains: `auth`, `user`, `verification`, `profile` (contacts/places),
`ride` (request, rides, fare, mapper), `driver`, `dispatch` (ranking
strategies — pure logic, no backend), `wallet`, `notifications`, `safety`.

## Ride lifecycle — the law

`RIDE_STATUS_TRANSITIONS` in `src/types/ride.ts` is the single source of
truth for legal status changes, mirroring the DB `ride_status` enum:

```
requested → accepted | matched | cancelled
matched   → accepted | cancelled
accepted  → arrived  | cancelled
arrived   → in_progress | cancelled
in_progress → completed | cancelled
completed / cancelled → (terminal)
```

It is enforced **twice**: client-side via `canTransition()` before every
write, and database-side by the `trg_enforce_ride_status_transition` trigger
(`scripts/phase6-audit-hardening.sql`). If the lifecycle ever changes, update
the type, the map, the trigger, and the DB enum together.

## Dispatch flow (real-time, as built)

1. Passenger inserts a `rides` row (`status='requested'`); the client shows a
   quote from the Pricing Engine and stores the pricing **inputs** (distance,
   duration, tier multiplier) on the row. The client fare is a display
   estimate only — money is decided by the DB (see Money below).
2. RLS broadcasts the open pool only to **verified female drivers**
   (`is_verified_female_driver`); the female-only guarantee is a DB trigger
   (`enforce_female_only_ride`), not client logic.
3. Drivers online heartbeat GPS into `driver_locations` every 15 s; the pool
   is ranked client-side by a pluggable `IRideRankingStrategy`
   (`src/services/dispatch/`) — currently nearest-pickup-first. Future
   matching (ratings, acceptance rate, surge, AI) means adding a strategy,
   not touching screens.
4. **`claim_ride` RPC** assigns the first accepting driver atomically
   (row-level `WHERE status='requested' AND driver_id IS NULL`) and marks the
   driver busy. Double-claims are rejected by the database, full stop.
5. Passenger's trip screen is live via a `postgres_changes` subscription on
   their ride row; the driver's position streams to them via a filtered
   subscription on `driver_locations` (RLS lets a passenger see only their
   own active driver).
6. **`complete_ride` RPC** settles money atomically. Stale requests are
   expired by `expire_stale_ride_requests()` (pg_cron, every minute).

## Money — non-negotiable

Wallet balances are mutated **only** inside `SECURITY DEFINER` functions
(`complete_ride`, `wallet_topup`). There are no direct client writes to
`wallets` or `transactions`, ever.

**Server-authoritative fare.** `complete_ride` does **not** trust the client's
`fare_estimate`. It recomputes the fare with `quote_fare(distance, duration,
tier_multiplier)` — a Postgres function that mirrors the Pricing Engine's
formula and reads every rate (including the **10% commission**) from the
`pricing_config` table. A tampered client price cannot move money.
Settlement (passenger debit + driver payout at `1 − commission` + a
transaction row for each + a `platform_ledger` row + ride completion) is one
DB transaction. `pricing_config` is the settlement rate card and is
admin-writable; keep its values in sync with the client engine's env config.

## Database change management

Schema lives in ordered, idempotent scripts under `scripts/`, run manually in
the Supabase SQL editor: `setup-database.sql` → `phase3` → `phase4` →
`phase5-hardening` → `phase6-audit-hardening` → `phase7-dispatch` (+ optional
`seed.sql`, `reset-database.sql`). After schema changes, extend
`src/integrations/supabase/types.ts` to match.

## Scalability posture

The client tier is stateless (SSR nodes hold no session state), so it scales
horizontally as-is; Postgres is the single shared state. The deliberate
future path at real load: move proximity matching fully server-side
(PostGIS + a dispatch RPC keyed on `nearest_available_drivers`), add read
replicas, then — only if measured — a Redis layer for hot presence data. The
strategy interface and RPC boundaries are the seams those changes slot into
without touching screens.
