# HeRide — the safest ride, for her

A premium, female-focused ride-hailing web app for Nairobi (KES, Nairobi mock
geo). Female passengers are matched with verified female drivers; safety
(SOS, live trip share, trusted contacts) is a first-class feature, not an
add-on.

This is a **single TanStack Start (React 19) app backed by Supabase** —
Postgres + Auth + Row-Level Security + Realtime. There is no separate backend
service: the database _is_ the backend, and the app's safety and money rules
are enforced by RLS policies and `SECURITY DEFINER` functions, so a client
bug can't bypass them.

## Stack

- **Frontend**: React 19, TanStack Start (file-based routes), Zustand, Tailwind
  v4 (oklch tokens), shadcn/ui, framer-motion
- **Backend**: Supabase — Postgres, Auth (email/password + phone OTP),
  Row-Level Security, Realtime, RPC functions
- **Tests**: Vitest (unit)
- **Tooling**: Vite 7, ESLint, Prettier

## Architecture conventions (preserve these)

- **Interface-first services** (`src/services/<domain>/`): every domain exposes
  an `IXxxService` interface with a **mock** and a **Supabase** implementation.
  A single flag (`VITE_USE_MOCKS`) selects which is used, app-wide, in that
  domain's `index.ts`. Components/stores never touch Supabase directly.
- **Feature folders** (`src/features/<name>/`) with screens/components/hooks.
- **One Zustand store per concern** (`src/store/*.store.ts`).
- **`ROUTES` constant** (`src/constants/routes.ts`) for all paths; file-based
  routes in `src/routes/` (`routeTree.gen.ts` is generated — never hand-edit).
- **`RIDE_STATUS_TRANSITIONS`** (`src/types/ride.ts`) is the single source of
  truth for legal ride status changes and mirrors the DB `ride_status` enum.
- **Money mutations only inside `SECURITY DEFINER` functions** (`complete_ride`,
  `wallet_topup`) — never a direct table write.

## Getting started

```bash
npm install
npm run dev          # http://localhost:8080  (add --host if your box lacks IPv6)
```

Environment (`.env`, already scaffolded):

```
VITE_SUPABASE_URL=...              # your Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY=...  # anon / publishable key (safe in the browser)
VITE_USE_MOCKS=false               # true = in-memory mocks, no backend needed
```

### Database setup (fresh Supabase project)

Run these in the Supabase SQL Editor **in order** (each is in `scripts/`):

1. `setup-database.sql` — core schema (identity, drivers, rides, safety),
   RLS, female-only enforcement, `claim_ride` + `nearest_available_drivers`
2. `phase3-database.sql` — ride counterparties can read each other's profile
3. `phase4-database.sql` — wallets, transactions, notifications, atomic
   `complete_ride`, `wallet_topup`, `raise_sos`, public `get_shared_trip`
4. `phase5-hardening.sql` — lock driver approval to admins (`set_driver_status`)
5. `seed.sql` _(optional)_ — demo admin, drivers, passengers, history
6. `reset-database.sql` — drops everything (to re-run setup cleanly)

For local testing, turn **Authentication → Sign In / Providers → Email →
"Confirm email"** off so signups get a session immediately.

## Scripts

| Command          | What                   |
| ---------------- | ---------------------- |
| `npm run dev`    | Dev server (port 8080) |
| `npm run build`  | Production build       |
| `npm run test`   | Vitest unit tests      |
| `npm run lint`   | ESLint                 |
| `npm run format` | Prettier write         |

## What works

- **Auth**: email/password register + login (gender captured — required by the
  female-only rule), session persistence, phone OTP wired (needs an SMS
  provider to deliver), password reset, email verification
- **Profile**: real profile, trusted contacts CRUD, saved places
- **Rides**: passenger booking → real ride row; driver availability + location
  pings; open-ride pool; **atomic `claim_ride`** (no double-booking); lifecycle
  transitions validated against `RIDE_STATUS_TRANSITIONS`; live trip screen and
  history via Realtime
- **Money**: per-user wallet; every completed trip settles atomically
  (passenger debit + driver payout at an 80% split + a transaction row each);
  invariant _balance = Σ completed transactions_ holds and is tested
- **Notifications**: in-app feed with a live unread bell; ride events auto-emit
  via a DB trigger
- **Safety**: SOS raises an incident; trip-share mints a public, time-boxed
  link (`/share/:token`) showing live status with no login

## Out of scope (v1)

Real payment providers (M-Pesa/Stripe), SMS/email/push delivery, paid maps
(haversine + address strings only). Wallet is credit-based; notifications are
in-app only.

## Known follow-ups

- `nearest_available_drivers` RPC exists but the driver pool currently uses a
  simple "pull" model (drivers see all open requests); ranked push-offers can
  layer on top later.
- Admin approval UI is not built yet — use `set_driver_status` (admin-only RPC)
  or `scripts/promote-test-driver.sql` for now.
