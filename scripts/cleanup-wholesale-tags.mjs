#!/usr/bin/env node
/**
 * One-off cleanup for retail customers wrongly tagged `wholesale-pending`.
 *
 * Until customer-account-get was fixed, it auto-tagged any customer with no
 * wholesale tag and no orders as wholesale-pending on every session read. Once
 * /signup existed, that pulled ordinary retail customers into the wholesale
 * approval queue, where an accidental Approve would have granted them
 * wholesale pricing.
 *
 * This is a thin driver. All the work (and every secret) lives in the
 * audit-wholesale-tags edge function; here we just authenticate and print.
 *
 *   node scripts/cleanup-wholesale-tags.mjs
 *   node scripts/cleanup-wholesale-tags.mjs --apply
 *
 * The admin password is read from .admin-password.local (gitignored) or from
 * ADMIN_PASSWORD in the environment.
 *
 * Without --apply nothing is written: it lists what WOULD be untagged and
 * stops. Run it that way first and read the list.
 */

import { readFileSync } from "node:fs";

// Must match src/integrations/supabase/client.ts. The edge functions this
// script calls run with verify_jwt = false, so a stale key still gets through
// to them — but it fails against anything that does check, which makes a wrong
// value here quietly misleading rather than loudly broken.
const SUPABASE_URL = "https://emziqfhzysyovohelvht.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtemlxZmh6eXN5b3ZvaGVsdmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2ODE0NTAsImV4cCI6MjA2NTI1NzQ1MH0.CsHMB3-aEKS2jx5X4ZEp5u_1hbZCZU0IcMwYYEjHpFk";

const APPLY = process.argv.includes("--apply");

/* The password comes from the environment, or from .admin-password.local in
   the repo root. The file exists so the secret never has to be typed into a
   command line — where it would land in shell history and in any transcript of
   the session. It is covered by the `*.local` rule in .gitignore, so it cannot
   be committed. Nothing here ever prints it. */
const PASSWORD_FILE = ".admin-password.local";

function readPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD.trim();
  try {
    return readFileSync(new URL(`../${PASSWORD_FILE}`, import.meta.url), "utf8").trim();
  } catch {
    return null;
  }
}

const password = readPassword();

async function fn(name, body) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) {
    throw new Error(data?.error ?? `${name} failed (${res.status})`);
  }
  return data;
}

const fmt = (c) =>
  `  ${(c.email ?? "—").padEnd(34)} ${c.name.padEnd(24)} ` +
  `orders:${String(c.numberOfOrders).padEnd(3)} ${c.createdAt.slice(0, 10)}`;

/* Everything runs inside main() so failures can `return` and let the process
   end on its own. Calling process.exit() while a fetch socket is still open
   trips a libuv assertion on Windows, which buries the actual message under a
   crash dump. */
async function main() {
  if (!password) {
    console.error("No admin password found. Either:");
    console.error(`  1. put it in ${PASSWORD_FILE} in the repo root (gitignored), or`);
    console.error("  2. set ADMIN_PASSWORD in the environment.");
    console.error("It is the same password as /wholesale-admin.");
    return 1;
  }

  // A wrong password comes back as a rejected call, so catch it here and say
  // so plainly rather than surfacing a stack trace at whoever is running this.
  let auth;
  try {
    auth = await fn("verify-admin-password", { password });
  } catch {
    auth = null;
  }
  if (!auth?.token) {
    console.error(`Incorrect admin password — check ${PASSWORD_FILE}.`);
    console.error("It is the same password you use for /wholesale-admin.");
    return 1;
  }

  let report;
  try {
    report = await fn("audit-wholesale-tags", { token: auth.token, mode: "list" });
  } catch (e) {
    if (/404|not found/i.test(e.message)) {
      console.error("The audit-wholesale-tags function is not deployed yet. Deploy it with:");
      console.error("  npx supabase functions deploy audit-wholesale-tags --project-ref emziqfhzysyovohelvht");
      return 1;
    }
    throw e;
  }

  console.log(`\nTagged wholesale-pending in Shopify: ${report.totalPending}\n`);

  console.log(`REAL APPLICATIONS — keep (${report.counts.genuine})`);
  console.log("  These filled in the wholesale form; a row exists in wholesale_requests.\n");

  if (report.needsReview.length) {
    console.log(`NEEDS YOUR EYES — not touched (${report.counts.needsReview})`);
    console.log("  No application on file, but they have orders or a company name,");
    console.log("  so they may be a real business. Decide these by hand.\n");
    report.needsReview.forEach((c) =>
      console.log(fmt(c) + (c.company ? `  company:${c.company}` : "")),
    );
    console.log("");
  }

  console.log(`TAGGED IN ERROR — retail customers (${report.counts.wronglyTagged})`);
  console.log("  No application, no orders, no company. These are the ones to untag.\n");
  report.wronglyTagged.forEach((c) => console.log(fmt(c)));

  if (report.wronglyTagged.length === 0) {
    console.log("  (none — nothing to clean up)\n");
    return 0;
  }

  if (!APPLY) {
    console.log(`\nDry run — nothing was changed.`);
    console.log(`Re-run with --apply to remove the tag from these ${report.counts.wronglyTagged}.`);
    return 0;
  }

  console.log(`\nRemoving the wholesale-pending tag from ${report.counts.wronglyTagged} customers…`);
  const result = await fn("audit-wholesale-tags", {
    token: auth.token,
    mode: "apply",
    customerIds: report.wronglyTagged.map((c) => c.id),
  });

  console.log(`Untagged: ${result.removedCount}`);
  if (result.failed?.length) {
    console.log(`Failed: ${result.failed.length}`);
    result.failed.forEach((f) => console.log(`  ${f.id}: ${f.error}`));
    return 1;
  }
  console.log("Done. They are now plain retail customers and are out of the queue.");
  return 0;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (e) => {
    console.error(e.message);
    process.exitCode = 1;
  },
);
