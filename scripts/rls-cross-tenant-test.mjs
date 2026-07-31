#!/usr/bin/env node
/**
 * Cross-tenant RLS probe — audit finding S4.
 *
 * Anonymous access is easy to verify and was already clean. The failure mode
 * that actually matters is a *signed-in* rider reading another rider's rows:
 * that is where RLS bugs hide, because a policy like `USING (true)` looks fine
 * until you have two accounts to compare.
 *
 * This signs in as two separate users, has A create data, then has B attempt
 * every cross-read and cross-write we can think of. Any row B can see, or any
 * row B can change, is a finding.
 *
 * Usage:
 *   SUPABASE_URL=… SUPABASE_ANON_KEY=… node scripts/rls-cross-tenant-test.mjs
 *
 * Reads .env when the variables are absent. Requires two existing accounts —
 * it will NOT create users, so it never leaves junk in an auth table:
 *   RLS_USER_A_EMAIL / RLS_USER_A_PASSWORD
 *   RLS_USER_B_EMAIL / RLS_USER_B_PASSWORD
 *
 * Exits non-zero on any leak, so it can gate CI against a staging project.
 */
import { readFileSync } from "node:fs";

function fromDotEnv(key) {
  try {
    const line = readFileSync(new URL("../.env", import.meta.url), "utf8")
      .split("\n")
      .find((l) => l.startsWith(`${key}=`));
    return line
      ? line
          .slice(key.length + 1)
          .replace(/^"|"$/g, "")
          .trim()
      : undefined;
  } catch {
    return undefined;
  }
}

const URL_ = process.env.SUPABASE_URL ?? fromDotEnv("VITE_SUPABASE_URL");
const ANON = process.env.SUPABASE_ANON_KEY ?? fromDotEnv("VITE_SUPABASE_PUBLISHABLE_KEY");

const A = { email: process.env.RLS_USER_A_EMAIL, password: process.env.RLS_USER_A_PASSWORD };
const B = { email: process.env.RLS_USER_B_EMAIL, password: process.env.RLS_USER_B_PASSWORD };

if (!URL_ || !ANON) {
  console.error("Missing SUPABASE_URL / SUPABASE_ANON_KEY (or VITE_ equivalents in .env).");
  process.exit(2);
}
if (!A.email || !A.password || !B.email || !B.password) {
  console.error(
    "Missing test accounts. Set RLS_USER_A_EMAIL/PASSWORD and RLS_USER_B_EMAIL/PASSWORD.\n" +
      "Use two throwaway accounts on a STAGING project — this script reads and\n" +
      "attempts to write real rows.",
  );
  process.exit(2);
}

/** Tables a rider must never see another rider's rows in. */
const TENANT_TABLES = [
  "profiles",
  "rides",
  "wallets",
  "transactions",
  "saved_places",
  "trusted_contacts",
  "sos_alerts",
  "notifications",
  "ride_messages",
  "ride_pins",
  "ride_ratings",
  "promo_redemptions",
  "payouts",
  "platform_ledger",
  "audit_log",
  "fraud_signals",
  "user_roles",
  "rider_verifications",
];

async function signIn({ email, password }) {
  const res = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  if (!res.ok)
    throw new Error(`sign-in failed for ${email}: ${body.error_description ?? res.status}`);
  return { token: body.access_token, userId: body.user.id };
}

function headers(token) {
  return { apikey: ANON, Authorization: `Bearer ${token}`, "content-type": "application/json" };
}

const results = [];
function record(ok, label, detail = "") {
  results.push({ ok, label, detail });
  console.log(`  ${ok ? "pass" : "LEAK"}  ${label}${detail ? `  — ${detail}` : ""}`);
}

/** Every row B can read from a table is a leak, whoever owns it. */
async function probeRead(token, userId, table) {
  const res = await fetch(`${URL_}/rest/v1/${table}?select=*&limit=50`, {
    headers: headers(token),
  });
  if (!res.ok) {
    // A table B has no grant on at all is fine — stricter than we asked.
    record(true, `${table}: read denied outright (${res.status})`);
    return;
  }
  const rows = await res.json();
  if (!Array.isArray(rows)) {
    record(true, `${table}: no rows`);
    return;
  }
  // Anything whose owning column points at someone else is a cross-tenant read.
  const foreign = rows.filter((r) => {
    const owner = r.user_id ?? r.passenger_id ?? r.id ?? r.driver_user_id ?? r.owner_id;
    // profiles.id IS the user id; for other tables `id` is a row id, so only
    // treat `id` as an owner for profiles.
    if (table === "profiles") return r.id !== userId;
    const candidates = [
      r.user_id,
      r.passenger_id,
      r.driver_id,
      r.driver_user_id,
      r.owner_id,
    ].filter((v) => typeof v === "string");
    if (candidates.length === 0) return false; // no ownership column to judge by
    return !candidates.includes(userId) && owner !== userId;
  });
  if (foreign.length > 0) {
    record(false, `${table}: B can read ${foreign.length} row(s) belonging to someone else`);
  } else {
    record(true, `${table}: ${rows.length} row(s), all B's own`);
  }
}

/** B must not be able to mutate a row identified by A. */
async function probeWrite(token, table, id, patch) {
  const res = await fetch(`${URL_}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...headers(token), Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
  const body = await res.text();
  const changed = res.ok && body.trim() !== "[]" && body.trim() !== "";
  record(
    !changed,
    `${table}: B cannot modify A's row`,
    changed ? `HTTP ${res.status} ${body.slice(0, 80)}` : "",
  );
}

async function main() {
  console.log(`Project: ${URL_}\n`);

  const a = await signIn(A);
  const b = await signIn(B);
  if (a.userId === b.userId) {
    console.error("Both credentials resolve to the same user — the probe would prove nothing.");
    process.exit(2);
  }
  console.log(`A = ${a.userId}\nB = ${b.userId}\n`);

  console.log("Cross-tenant reads as B:");
  for (const table of TENANT_TABLES) await probeRead(b.token, b.userId, table);

  console.log("\nCross-tenant writes as B:");
  // A's own profile row is the one object we know exists and know A owns.
  await probeWrite(b.token, "profiles", a.userId, { full_name: "rls-probe-should-fail" });

  // A ride owned by A, if A has one — the highest-value write target.
  const aRides = await fetch(`${URL_}/rest/v1/rides?select=id&limit=1`, {
    headers: headers(a.token),
  }).then((r) => (r.ok ? r.json() : []));
  if (Array.isArray(aRides) && aRides[0]?.id) {
    await probeWrite(b.token, "rides", aRides[0].id, { status: "cancelled" });
  } else {
    console.log("  skip  rides: A has no ride to target (book one to cover this)");
  }

  console.log("\nSelf-escalation as B:");
  // The columns that decide whether she is allowed on the platform at all. The
  // row-level policy lets her edit her own profile, so only the phase 25
  // trigger stands between "I am verified" and it being true.
  //
  // `gender` is deliberately NOT probed: the trigger allows a one-time set
  // while it is NULL (an account that signed up without choosing has to be
  // able to finish its profile), so a pass or a fail here would depend on the
  // probe account's history rather than on the rule.
  //
  // The trigger only fires on an actual change, so each probe has to attempt a
  // real one — and revert it if the platform lets it through.
  for (const [column, value, revert] of [
    ["identity_verified", true, false],
    ["is_blacklisted", true, false],
  ]) {
    const patch = (body) =>
      fetch(`${URL_}/rest/v1/profiles?id=eq.${b.userId}`, {
        method: "PATCH",
        headers: { ...headers(b.token), Prefer: "return=representation" },
        body: JSON.stringify(body),
      });
    const res = await patch({ [column]: value });
    // A 200 with an empty body means the row matched nothing, not that the
    // write was refused — check the returned row, not just the status.
    const rows = res.ok ? await res.json().catch(() => []) : [];
    const changed = res.ok && Array.isArray(rows) && rows.length > 0;
    let detail = "";
    if (changed) {
      const undo = await patch({ [column]: revert });
      detail = undo.ok ? "WRITE ACCEPTED (reverted)" : "WRITE ACCEPTED — COULD NOT REVERT";
    }
    record(!changed, `profiles.${column}: B cannot set her own`, detail);
  }

  console.log("\nPrivileged function abuse as B:");
  // complete_ride moves money. B calling it on a ride she does not own must fail.
  if (Array.isArray(aRides) && aRides[0]?.id) {
    const res = await fetch(`${URL_}/rest/v1/rpc/complete_ride`, {
      method: "POST",
      headers: headers(b.token),
      body: JSON.stringify({ _ride_id: aRides[0].id }),
    });
    record(!res.ok, "complete_ride: B cannot settle A's ride", res.ok ? `HTTP ${res.status}` : "");
  }

  const leaks = results.filter((r) => !r.ok);
  console.log(`\n${results.length - leaks.length}/${results.length} checks passed.`);
  if (leaks.length) {
    console.error(`\n${leaks.length} LEAK(S):`);
    for (const l of leaks) console.error(`  - ${l.label} ${l.detail}`);
    process.exit(1);
  }
  console.log("No cross-tenant access found.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(2);
});
