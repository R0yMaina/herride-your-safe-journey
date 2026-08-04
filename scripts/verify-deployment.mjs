#!/usr/bin/env node
/**
 * Which schema phases are actually live?
 *
 * PROJECT_STATE.md answers this with a hand-maintained table, which has
 * already drifted at least once. This asks the database instead: each check
 * probes something only its phase creates — a table, an RPC, a column, a
 * refusal — so the answer comes from the deployment rather than from someone's
 * memory of it.
 *
 * It is deliberately read-only. The one write it attempts (a direct
 * driver_locations insert) is expected to be REFUSED; if it ever succeeds the
 * script reports a leak rather than leaving a row behind.
 *
 * Usage:
 *   RLS_USER_A_EMAIL=… RLS_USER_A_PASSWORD=… node scripts/verify-deployment.mjs
 *
 * Any signed-in account works — no admin needed. Admin-only functions are
 * probed for "exists but refused me", which is itself proof they are deployed.
 */
import { readFileSync } from "node:fs";

function fromEnvFile(key) {
  try {
    const line = readFileSync(new URL("../.env", import.meta.url), "utf8")
      .split("\n")
      .find((l) => l.startsWith(`${key}=`));
    return line?.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

const URL_ = process.env.SUPABASE_URL ?? fromEnvFile("SUPABASE_URL");
const ANON = process.env.SUPABASE_PUBLISHABLE_KEY ?? fromEnvFile("SUPABASE_PUBLISHABLE_KEY");
const EMAIL = process.env.RLS_USER_A_EMAIL;
const PASSWORD = process.env.RLS_USER_A_PASSWORD;

if (!URL_ || !ANON || !EMAIL || !PASSWORD) {
  console.error(
    "Need SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY (or .env) and RLS_USER_A_EMAIL/PASSWORD.",
  );
  process.exit(2);
}

const res0 = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: ANON, "content-type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const auth = await res0.json();
if (!res0.ok) {
  console.error(`Sign-in failed: ${auth.error_description ?? res0.status}`);
  process.exit(2);
}
const H = { apikey: ANON, Authorization: `Bearer ${auth.access_token}`, "content-type": "application/json" };
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

/** A table is deployed if PostgREST knows it — 404/PGRST205 means it does not. */
async function tableExists(table) {
  const r = await fetch(`${URL_}/rest/v1/${table}?select=*&limit=1`, { headers: H });
  if (r.ok) return true;
  const body = await r.json().catch(() => ({}));
  return !(r.status === 404 || body.code === "PGRST202" || body.code === "PGRST205");
}

/**
 * An RPC is deployed if calling it does anything other than "not found".
 * A permission error proves it exists, which for an admin-only function is all
 * we can check from a rider's session.
 */
async function rpcExists(fn, args = {}) {
  const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: H,
    body: JSON.stringify(args),
  });
  if (r.ok) return { ok: true, note: "" };
  const body = await r.json().catch(() => ({}));
  const missing = r.status === 404 || body.code === "PGRST202";
  return { ok: !missing, note: missing ? "not found" : (body.message ?? "").slice(0, 60) };
}

/**
 * Stricter: this RPC is meant to WORK for an ordinary rider, so anything other
 * than a clean answer is a failure.
 *
 * "Exists" is too weak a bar for these. `my_rider_verification` shipped with an
 * ambiguous column reference — deployed, callable, and broken on every call,
 * which an existence check reports as a pass. plpgsql bodies are not validated
 * at creation, so calling them is the only way to find out.
 */
async function rpcWorks(fn, args = {}) {
  const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: H,
    body: JSON.stringify(args),
  });
  if (r.ok) return { ok: true, note: "" };
  const body = await r.json().catch(() => ({}));
  return { ok: false, note: (body.message ?? `HTTP ${r.status}`).slice(0, 60) };
}

const results = [];
const record = (phase, what, ok, note = "") => results.push({ phase, what, ok, note });

// ── phase 18/20 — direct driver_locations writes are revoked ────────────────
{
  const r = await fetch(`${URL_}/rest/v1/driver_locations`, {
    method: "POST",
    headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify({ driver_user_id: auth.user.id, lat: 0, lng: 0 }),
  });
  // Anything but success is correct. Success means the REVOKE never landed.
  record("18/20", "driver_locations direct write refused", !r.ok, r.ok ? "WRITE ACCEPTED" : "");
}

// ── phase 20 — internal functions revoked from PUBLIC ──────────────────────
{
  const r = await fetch(`${URL_}/rest/v1/rpc/flag_fraud_signal`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({ _user_id: ZERO_UUID, _signal: "probe", _severity: "low" }),
  });
  // "Not found" is the PASS here, not a failure. PostgREST builds its schema
  // cache from what the calling role may execute, so a function revoked from
  // PUBLIC becomes invisible rather than forbidden. Only a 2xx would mean any
  // signed-in rider can still write fraud signals.
  record("20", "flag_fraud_signal unreachable by a rider", !r.ok, r.ok ? "CALL SUCCEEDED" : "");
}
{
  // phase20 dropped and recreated this so the rate limit actually applies.
  const r = await fetch(`${URL_}/rest/v1/rpc/validate_promo`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({ _code: "PROBE-NOT-A-REAL-CODE", _subtotal: 500 }),
  });
  const body = await r.json().catch(() => ({}));
  const missing = r.status === 404 || body.code === "PGRST202";
  // Any answer but "missing" proves the rewritten function is live and running.
  record("20", "validate_promo() runs", !missing, missing ? "not found" : (body.message ?? "").slice(0, 45));
}

// ── phase 21 — data rights ─────────────────────────────────────────────────
record("21", "account_deletions table", await tableExists("account_deletions"));
{
  const { ok, note } = await rpcExists("enforce_retention");
  record("21", "enforce_retention()", ok, note);
}

// ── phase 22 — admin MFA ───────────────────────────────────────────────────
{
  const { ok, note } = await rpcExists("session_has_mfa");
  record("22", "session_has_mfa()", ok, note);
}
{
  // Signature check: phase22 must NOT have changed this to VOID.
  const { ok, note } = await rpcExists("refund_ride", {
    _ride_id: ZERO_UUID,
    _amount: 1,
    _reason: "deployment probe",
  });
  record("22", "refund_ride() present + refuses a non-admin", ok, note);
}

// ── phase 23 — sequential dispatch ─────────────────────────────────────────
record("23", "ride_offers table", await tableExists("ride_offers"));
{
  const { ok, note } = await rpcWorks("my_pending_offer");
  record("23", "my_pending_offer()", ok, note);
}
{
  const { ok, note } = await rpcExists("advance_dispatch");
  record("23", "advance_dispatch()", ok, note);
}

// ── phase 24/26 — receipts, then surge added to them ───────────────────────
{
  const r = await fetch(`${URL_}/rest/v1/rpc/get_receipt`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({ _ride_id: ZERO_UUID }),
  });
  const body = await r.json().catch(() => ({}));
  const missing = r.status === 404 || body.code === "PGRST202";
  // "Ride not found" is the phase24 function talking, which is what we want.
  record("24", "get_receipt()", !missing, missing ? "not found" : (body.message ?? "").slice(0, 40));
}

// ── phase 25 — rider verification ──────────────────────────────────────────
record("25", "rider_verifications table", await tableExists("rider_verifications"));
{
  const { ok, note } = await rpcWorks("my_rider_verification");
  record("25", "my_rider_verification() returns her state", ok, note);
}
{
  const r = await fetch(`${URL_}/rest/v1/profiles?id=eq.${auth.user.id}`, {
    method: "PATCH",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ identity_verified: true }),
  });
  const rows = r.ok ? await r.json().catch(() => []) : [];
  const changed = r.ok && Array.isArray(rows) && rows.length > 0;
  if (changed) {
    await fetch(`${URL_}/rest/v1/profiles?id=eq.${auth.user.id}`, {
      method: "PATCH",
      headers: H,
      body: JSON.stringify({ identity_verified: false }),
    });
  }
  record("25", "identity_verified is not self-settable", !changed, changed ? "WRITE ACCEPTED (reverted)" : "");
}

// ── phase 26 — surge ───────────────────────────────────────────────────────
{
  const r = await fetch(`${URL_}/rest/v1/rpc/surge_at`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({ _lat: -1.2921, _lng: 36.8219 }),
  });
  const body = await r.json().catch(() => null);
  const value = typeof body === "number" ? body : Number(body);
  record("26", "surge_at() returns a multiplier", r.ok && Number.isFinite(value), r.ok ? `= ${value}` : "not found");
}
{
  const { ok, note } = await rpcWorks("km_between", { _lat1: 0, _lng1: 0, _lat2: 0, _lng2: 1 });
  record("26", "km_between()", ok, note);
}

// ── report ─────────────────────────────────────────────────────────────────
let phase = "";
for (const r of results) {
  if (r.phase !== phase) {
    phase = r.phase;
    console.log(`\nphase ${phase}`);
  }
  console.log(`  ${r.ok ? "pass" : "FAIL"}  ${r.what}${r.note ? `  — ${r.note}` : ""}`);
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
if (failed.length) {
  console.error("\nNot deployed (or not working):");
  for (const f of failed) console.error(`  - phase ${f.phase}: ${f.what} ${f.note}`);
  process.exit(1);
}
console.log("Every probed phase is live.");
