# PROJECT_STATE.md

Last updated: 2026-07-28 (Phases 15–16 — driver app, HerShield verification, PWA).

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
- **Pricing authority (Phase 9)** — server-side `quote_fare` + `pricing_config`
  (10% commission); `complete_ride` recomputes the fare server-side.
- **Financial completion (Phase 10)** — receipts (`get_receipt`), analytics
  (`financial_report`, top drivers/customers/routes), immutable `audit_log`,
  fraud signals, pricing-quote events.
- **Ratings & tips (Phase 11)** — post-trip 1–5 stars + compliments +
  optional wallet-funded tip via `submit_rating` (SECURITY DEFINER; tips move
  wallet→wallet server-side only). Trigger keeps `drivers.rating` in sync.
  `RatingSheet` on the completed trip screen.
- **In-ride chat (Phase 12)** — `ride_messages` + Realtime; participants
  only, live rides only; quick replies; counterparty notification trigger.
  Chat sheets on both the passenger trip screen and driver active-trip card.
- **Growth (Phase 13)** — promo codes (`validate_promo`/`apply_promo`,
  settlement honours the locked-in discount), referral program
  (`get_referral_code`/`redeem_referral`, both wallets credited on the
  referee's first completed trip), OS-level notification bridge + enable
  toggle in Profile. Promo field on Confirm step; Invite & earn on Profile.
- **Trip flexibility (Phase 14)** — scheduled rides persisted
  (`scheduled_for`; drivers see them 30 min before pickup), multi-stop rides
  (`waypoints`, max 2 stops, OSRM multi-leg routing priced into the quote).
- **Two-door onboarding (Phase 15A)** — welcome screen offers "Ride with
  HeRide" / "Drive with HeRide". Driver applicants submit licence, national
  ID, vehicle and identity photos (private `driver-docs` bucket) via
  `apply_as_driver` (female-only, enforced server-side) and track
  pending/approved/rejected status. `set_driver_status` v2 grants the driver
  role on verification and revokes it on rejection/suspension.
- **Pickup PIN — HerShield layer 2 (Phase 15B)** — `ride_pins` (passenger-
  readable only) issued on driver assignment; `start_trip_with_pin` is the
  only path arrived → in_progress for PIN'd rides, enforced by a DB trigger.
  3+ wrong attempts file a high-severity fraud signal.
- **Driver app (Phase 15C)** — `/driver` is its own shell with its own nav
  (Drive · Earnings · Trips · Profile). `driver_earnings` RPC powers
  today/week/lifetime, trips, tips and commission; cash-out to M-Pesa;
  trip history; driver profile with verification badge and "Switch to riding".
- **Verification desk (Phase 15D)** — `/admin/drivers`: pending/verified/
  rejected/suspended queue, documents opened via short-lived signed URLs,
  approve/reject-with-reason/suspend, all audited.
- **PWA (Phase 16)** — installable on any phone: manifest (standalone,
  violet theme, Book/Drive shortcuts), icon set, iOS home-screen meta, and a
  network-first service worker (ride data is never served stale) with a
  branded offline page as the only fallback.

## SQL scripts — application status

**This table was wrong for a long time** — it listed eleven scripts as pending
that had in fact been applied. A hand-maintained ledger of what is deployed is
worth less than no ledger, because it is trusted. Treat the probe below as the
source of truth and re-run it rather than editing from memory.

Verification on **30 Jul 2026**, by anonymous PostgREST reads against project
`jhebtnrifgiabmvgmqrb` (a table that answers exists; RLS still returns 0 rows):

```bash
U=$(grep VITE_SUPABASE_URL .env | cut -d'"' -f2)
K=$(grep VITE_SUPABASE_PUBLISHABLE_KEY .env | cut -d'"' -f2)
curl -s -o /dev/null -w "%{http_code}\n" "$U/rest/v1/<table>?select=*&limit=0" -H "apikey: $K"
# 200 = present, PGRST205 = the script has not been applied
```

| Script | Status | Evidence |
| --- | --- | --- |
| setup-database.sql | ✅ applied | `profiles`, `rides`, `drivers`, `driver_locations` all answer |
| phase3-database.sql | ✅ applied | ride lifecycle live |
| phase4-database.sql | ✅ applied | `sos_alerts`, `trip_shares`, `notifications` answer |
| phase5-hardening.sql | ❓ unverified | policies/functions only — nothing to probe |
| phase6-audit-hardening.sql | ✅ applied | `audit_log` answers |
| phase7-dispatch.sql | ❓ unverified | policies/functions only — nothing to probe |
| phase8-financials.sql | ✅ applied | `platform_ledger`, `payouts` answer |
| phase9-pricing-authority.sql | ✅ applied | `pricing_config` answers; `quote_fare(4,10,1)=530` |
| phase10-financial-completion.sql | ✅ applied | — |
| phase11-ratings-tips.sql | ✅ applied | `ride_ratings` answers |
| phase12-chat.sql | ✅ applied | `ride_messages` answers |
| phase13-growth.sql | ✅ applied | `promo_codes`, `referral_codes` answer |
| phase14-trip-flexibility.sql | ✅ applied | — |
| phase15-driver-onboarding.sql | ✅ applied | `fraud_signals` answers; docs bucket needs a dashboard check |
| phase15b-pickup-pin.sql | ✅ applied | `ride_pins` answers |
| phase15c-driver-earnings.sql | ❓ unverified | RPC only — nothing to probe |
| phase17-admin-dashboard.sql | ✅ applied | `platform_owners` answers |
| phase18-security-hardening.sql | ⏳ user must run | rate limits, GPS sanity checks, account deletion |
| seed.sql | optional | test accounts for local/staging only |

**Replace this table.** Each script should `INSERT` its own name into a
`schema_migrations` table on success, so "what is deployed" is a query rather
than a document someone has to remember to update.

## Known gaps / deliberate v1 scope

- No real payment provider (wallet is credit-based; dev top-up only).
- No SMS/email delivery. OS notifications work while a tab is open (bridge in
  `features/notifications/lib/push.ts`); true Web Push (VAPID + service
  worker + edge function) is the upgrade path.
- In-app voice calls not built — chat covers rider↔driver contact without
  sharing numbers; masked calling needs a telephony provider (Twilio /
  Africa's Talking).
- Admin driver-approval UI not built (`set_driver_status` RPC exists).
- Cloudflare "Workers Builds" check on PRs fails instantly — misconfigured
  integration on the Cloudflare side, unrelated to the code.
