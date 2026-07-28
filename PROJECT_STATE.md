# PROJECT_STATE.md

Last updated: 2026-07-24 (Phase 7 — real-time dispatch).

## Live target

Supabase project `jhebtnrifgiabmvgmqrb` (the user's own account). The app
reads its keys from the git-tracked `.env` (publishable keys only).
Branch: `claude/heride-full-stack-setup-3ed04h` · PR #3 open against `main`.

## Built and live-verified

- **Auth** — email/password sign-up (gender captured), sign-in, session
  persistence, guards, roles (admin > driver > passenger). Verified E2E.
- **Profile** — identity, trusted contacts, saved places. Verified E2E.
- **Ride lifecycle** — request → open pool (RLS: verified female drivers
  only) → atomic `claim_ride` (double-claim rejected, verified) → arrived →
  in_progress → `complete_ride`. Live `/trip/$rideId`, `/driver`, `/rides`.
- **Money** — atomic settlement verified both sides
  (balance == Σ completed transactions).
- **Notifications** — DB trigger emits on status changes; realtime bell.
- **Safety** — SOS (`raise_sos`), trip share (`get_shared_trip`, anon
  `/share/$token`).
- **Dispatch (Phase 7)** — pluggable ranking strategy (nearest-first),
  driver-position streaming to the passenger, passenger-cancel sync to the
  driver screen, busy-driver semantics, stale-request expiry.
- **Pricing Engine (Phase 7.5)** — `src/services/pricing/`: one centralized,
  config-driven, strategy-based fare calculator. `computeFare` is now a thin
  adapter over it (v1 parity preserved). No module computes prices directly.
- **Financial ecosystem (Phase 8)** — `src/services/{payments,payouts,finance}/`:
  payment-provider abstraction (cash/wallet live; M-Pesa/card = declared
  providers pending credentials), driver payouts, admin financial summary.
  Immutable ledger + platform_ledger + payment_intents + payouts + refund
  architecture in the DB. Admin dashboard at `/admin/finance`.

## SQL scripts — application status

| Script | Applied to live DB? |
| --- | --- |
| setup-database.sql | ✅ |
| phase3-database.sql | ✅ |
| phase4-database.sql | ✅ |
| phase5-hardening.sql | ⏳ user must run |
| phase6-audit-hardening.sql | ⏳ user must run (token-enumeration fix) |
| phase7-dispatch.sql | ⏳ user must run (busy drivers, location RLS, expiry) |
| phase8-financials.sql | ⏳ user must run (immutable ledger, payouts, refunds, admin summary) |
| phase9-pricing-authority.sql | ⏳ user must run (pricing_config, server-side quote_fare, 10% commission) |
| seed.sql | optional |

## Known gaps / deliberate v1 scope

- No real payment provider (wallet is credit-based; dev top-up only).
- No SMS/email/push delivery (in-app notifications only).
- No map rendering (locations are addresses + coordinates; Maps key exists
  but should be domain-restricted in Google Cloud Console).
- Scheduled rides UI exists but is not persisted (no `scheduled_for` column).
- Admin driver-approval UI not built (`set_driver_status` RPC exists).
- Cloudflare "Workers Builds" check on PRs fails instantly — misconfigured
  integration on the Cloudflare side, unrelated to the code.
