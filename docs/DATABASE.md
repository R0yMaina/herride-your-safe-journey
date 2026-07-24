# HeRide Database Guide

The entire backend is a Supabase Postgres database. This document explains
what lives in it and how to apply changes.

## How schema changes are applied

There is no automatic migration runner. Schema lives in ordered, idempotent
SQL scripts in `scripts/`, and **you apply them by hand** in the Supabase SQL
editor:

1. Open https://supabase.com/dashboard/project/jhebtnrifgiabmvgmqrb/sql/new
2. Open the script file, select **all** of its contents, copy.
3. Paste into the editor and press **Run**.
4. Run the scripts **in order**. Every script is safe to re-run.

| Order | Script | What it does |
| --- | --- | --- |
| 1 | `setup-database.sql` | Core schema: profiles, roles, drivers, rides, driver_locations, trip_shares, sos_alerts, ratings; RLS; `claim_ride`; `nearest_available_drivers`; realtime publication |
| 2 | `phase3-database.sql` | Lets ride counterparties read each other's public profile |
| 3 | `phase4-database.sql` | Wallets, transactions, notifications; `complete_ride`, `wallet_topup`, `raise_sos`, `get_shared_trip`; auto-notification trigger |
| 4 | `phase5-hardening.sql` | Driver approval locked to admins (`set_driver_status`); self-registration always lands 'pending' |
| 5 | `phase6-audit-hardening.sql` | Closes anon trip-share token enumeration; DB-level ride state machine trigger; indexes |
| 6 | `phase7-dispatch.sql` | Busy-driver semantics in `claim_ride`; passenger→driver location RLS; availability restore trigger; stale-request expiry (pg_cron) |
| — | `seed.sql` (optional) | Idempotent demo data |
| — | `reset-database.sql` | Destructive clean reset |

After changing schema, extend `src/integrations/supabase/types.ts` by hand to
match (it is not auto-regenerated in this repo).

## Core tables

- **profiles** — one row per auth user (created by the `handle_new_user`
  trigger). Holds `gender`, `is_blacklisted`. Female-only rides are enforced
  by the `enforce_female_only_ride` DB trigger, not client code.
- **user_roles** — passenger / driver / admin (checked via `has_role`).
- **drivers** — vehicle + `verification_status`; only admins can change
  status (phase 5).
- **rides** — the lifecycle row. `status` is the `ride_status` enum; legal
  transitions are enforced by `trg_enforce_ride_status_transition` (phase 6)
  and mirrored in `RIDE_STATUS_TRANSITIONS` in `src/types/ride.ts`.
- **driver_locations** — one row per driver: GPS heartbeat + `is_available`
  (presence). In the realtime publication for live streaming.
- **wallets / transactions** — balances mutate **only** inside
  `SECURITY DEFINER` functions (`complete_ride`, `wallet_topup`).
- **notifications** — written by DB triggers on ride events; streamed to the
  owner.
- **trip_shares / sos_alerts** — safety. Anon access to a shared trip goes
  only through `get_shared_trip(token)` (phase 6).

## Key functions (RPCs)

| Function | Purpose |
| --- | --- |
| `claim_ride(_ride_id)` | Atomic driver assignment; rejects double-claims; marks driver busy (phase 7) |
| `complete_ride(_ride_id)` | Atomic settlement: passenger debit, 80% driver payout, tx rows, ride completion |
| `wallet_topup(_amount)` | Credit top-up (dev) |
| `nearest_available_drivers(lat, lng, radius, limit)` | Proximity query over fresh (<2 min) available verified female drivers |
| `raise_sos(_ride_id)` | Emergency incident |
| `get_shared_trip(_token)` | The only anon read path for shared trips |
| `expire_stale_ride_requests(minutes)` | Cancels unaccepted requests (pg_cron, phase 7) |
| `set_driver_status(...)` | Admin-only driver approval (phase 5) |
