#!/usr/bin/env tsx
/**
 * Google Indexing API submission script — TASK-05 re-run (2026-02-25).
 *
 * Submits 5 test URLs to the Indexing API using the shared JWT auth pattern.
 * Requires: .secrets/ga4/brikette-web-2b73459e229a.json
 * Scope: https://www.googleapis.com/auth/indexing
 *
 * Run with:
 *   source /Users/petercowling/base-shop/.env.local && \
 *   tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/indexing-api-submit.ts
 */

import {
  DEFAULT_SA_KEY_PATH,
  GSC_SCOPE_INDEXING,
  getAccessToken,
  loadServiceAccount,
} from "./gsc-auth.js";

const INDEXING_API_URL =
  "https://indexing.googleapis.com/v3/urlNotifications:publish";

const TEST_URLS = [
  "https://hostel-positano.com/en/experiences/arienzo-beach-guide",
  "https://hostel-positano.com/en/experiences/boat-tours-positano",
  "https://hostel-positano.com/en/experiences/capri-on-a-budget",
  "https://hostel-positano.com/en/how-to-get-here/amalfi-positano-ferry",
  "https://hostel-positano.com/it/come-arrivare/amalfi-positano-bus",
];

async function main() {
  const sa = loadServiceAccount(DEFAULT_SA_KEY_PATH);
  console.log(`SA email: ${sa.client_email}`);

  const token = await getAccessToken(sa, GSC_SCOPE_INDEXING);
  console.log(`Access token obtained (length: ${token.length})\n`);

  for (const url of TEST_URLS) {
    console.log(`Submitting: ${url}`);
    const resp = await fetch(INDEXING_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, type: "URL_UPDATED" }),
    });
    const body = await resp.text();
    console.log(`  Status: ${resp.status}`);
    console.log(`  Body:   ${body}`);
    console.log();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
