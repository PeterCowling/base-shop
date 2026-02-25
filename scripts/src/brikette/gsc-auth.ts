#!/usr/bin/env tsx
/**
 * Shared Google Search Console JWT authentication helper.
 *
 * Replicates the exact auth pattern from ga4-run-report.ts (RS256, no SDK).
 * Used by: gsc-url-inspection-batch.ts, gsc-search-analytics.ts, gsc-sitemap-ping.ts
 *
 * Requires: .secrets/ga4/brikette-web-2b73459e229a.json (service account key)
 * Scope: passed by each consumer (webmasters.readonly, indexing, etc.)
 */

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

export type ServiceAccountKey = {
  client_email: string;
  private_key: string;
  token_uri: string;
};

export const DEFAULT_SA_KEY_PATH = path.resolve(
  __dirname,
  "../../../.secrets/ga4/brikette-web-2b73459e229a.json",
);

export const GSC_SCOPE_READONLY = "https://www.googleapis.com/auth/webmasters.readonly";
export const GSC_SCOPE_INDEXING = "https://www.googleapis.com/auth/indexing";

function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64url");
}

function createJWT(sa: ServiceAccountKey, scope: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    scope,
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  };

  const segments = [
    base64url(JSON.stringify(header)),
    base64url(JSON.stringify(payload)),
  ];
  const signingInput = segments.join(".");
  const signature = crypto.sign("sha256", Buffer.from(signingInput), sa.private_key);
  return `${signingInput}.${base64url(signature)}`;
}

export async function getAccessToken(sa: ServiceAccountKey, scope: string): Promise<string> {
  const jwt = createJWT(sa, scope);
  const resp = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!resp.ok) {
    throw new Error(`Token exchange failed: ${resp.status} ${await resp.text()}`);
  }
  const data = (await resp.json()) as { access_token: string };
  return data.access_token;
}

export function loadServiceAccount(keyPath: string): ServiceAccountKey {
  try {
    const raw = fs.readFileSync(keyPath, "utf8");
    return JSON.parse(raw) as ServiceAccountKey;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Auth failure: could not load service account key at "${keyPath}": ${msg}`);
  }
}
