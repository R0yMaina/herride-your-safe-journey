# PROJECT_STATE.md

Last updated: 2026-07-28 (Phases 11–14 — ratings/tips, chat, growth, trip flexibility).

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
| phase9-pricing-authority.sql | ✅ (verified: quote_fare(4,10,1)=530, commission 0.10) |
| phase10-financial-completion.sql | ✅ |
| phase11-ratings-tips.sql | ⏳ user must run (ratings, compliments, tips, driver-rating trigger) |
| phase12-chat.sql | ⏳ user must run (ride_messages + Realtime + policies) |
| phase13-growth.sql | ⏳ user must run (promo codes, referrals, complete_ride v3 with discount) |
| phase14-trip-flexibility.sql | ⏳ user must run (scheduled_for, waypoints, release window) |
| seed.sql | optional |

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
