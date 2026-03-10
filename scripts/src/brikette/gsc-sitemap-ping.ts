#!/usr/bin/env tsx
/**
 * GSC Sitemaps API re-ping script for Brikette.
 *
 * Purpose: Notify Google that the sitemap has been updated after a content
 * deploy. Calls the GSC Sitemaps API to re-submit the sitemap URL, prompting
 * Google to re-crawl it. This is the programmatic complement to the
 * static sitemap submission in GSC — it signals content freshness after deploys.
 *
 * Usage (run from repo root):
 *   tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-sitemap-ping.ts
 *   tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-sitemap-ping.ts --sitemap https://hostel-positano.com/sitemap.xml
 *   tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-sitemap-ping.ts --site sc-domain:hostel-positano.com
 *
 * Timing: Run after every Brikette content deploy. See monitoring-log.md.
 *
 * Auth: .secrets/ga4/brikette-web-2b73459e229a.json (service account)
 * Scope: webmasters (read + write, required for PUT)
 * HTTP method: PUT (returns 204 No Content on success)
 * GSC property: sc-domain:hostel-positano.com
 *
 * Note: The Sitemaps API requires webmasters scope (not webmasters.readonly).
 * The same SA key is used, but a broader OAuth scope is requested.
 */

import * as path from "node:path";

import {
  DEFAULT_SA_KEY_PATH,
  getAccessToken,
  loadServiceAccount,
} from "./gsc-auth";

// webmasters (read+write) scope required for PUT operations on sitemaps
const GSC_SCOPE_WEBMASTERS = "https://www.googleapis.com/auth/webmasters";
const DEFAULT_SITE_URL = "sc-domain:hostel-positano.com";
const DEFAULT_SITEMAP_URL = "https://hostel-positano.com/sitemap.xml";

function parseArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function pingSitemap(
  token: string,
  siteUrl: string,
  sitemapUrl: string,
): Promise<{ status: number; body: string }> {
  const siteEncoded = encodeURIComponent(siteUrl);
  const feedpathEncoded = encodeURIComponent(sitemapUrl);
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${siteEncoded}/sitemaps/${feedpathEncoded}`;

  const resp = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const body = resp.status === 204 ? "" : await resp.text();
  return { status: resp.status, body };
}

async function main(): Promise<void> {
  const siteUrl = parseArg("--site") ?? DEFAULT_SITE_URL;
  const sitemapUrl = parseArg("--sitemap") ?? DEFAULT_SITEMAP_URL;
  const saKeyPath = parseArg("--sa-key") ?? DEFAULT_SA_KEY_PATH;

  process.stdout.write(`Pinging sitemap: ${sitemapUrl}\n`);
  process.stdout.write(`Property: ${siteUrl}\n`);

  // Load SA and get token
  let token: string;
  try {
    const sa = loadServiceAccount(saKeyPath);
    token = await getAccessToken(sa, GSC_SCOPE_WEBMASTERS);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Auth failure: ${msg}\n`);
    process.exit(1);
  }

  // Call Sitemaps API
  let result: { status: number; body: string };
  try {
    result = await pingSitemap(token, siteUrl, sitemapUrl);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Sitemaps API request failed: ${msg}\n`);
    process.exit(1);
  }

  // 204 No Content = success
  if (result.status === 204 || result.status === 200) {
    process.stdout.write(`OK (HTTP ${result.status}): Sitemap re-pinged successfully.\n`);
    process.stdout.write(`Google has been notified of the updated sitemap at: ${sitemapUrl}\n`);
    process.exit(0);
  }

  // 404: sitemap not registered in GSC
  if (result.status === 404) {
    process.stderr.write(
      `Error (HTTP 404): Sitemap not found in GSC for property "${siteUrl}".\n` +
      `Action required: submit the sitemap manually at https://search.google.com/search-console/\n` +
      `  Go to Sitemaps → Add a new sitemap → enter: ${sitemapUrl}\n`,
    );
    process.exit(1);
  }

  // Other error
  process.stderr.write(
    `Error (HTTP ${result.status}): Sitemaps API returned an unexpected response.\n` +
    `Response body:\n${result.body}\n`,
  );
  process.exit(1);
}

void main();
