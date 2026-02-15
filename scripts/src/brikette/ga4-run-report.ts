#!/usr/bin/env tsx
/**
 * GA4 Data API report helper for Brikette.
 *
 * Goal: provide a reproducible, scriptable `runReport` query so weekly baselines
 * are not "copy/paste from UI".
 *
 * Usage examples:
 *   tsx scripts/src/brikette/ga4-run-report.ts
 *   tsx scripts/src/brikette/ga4-run-report.ts --window 7daysAgo..today
 *   tsx scripts/src/brikette/ga4-run-report.ts --events page_view,user_engagement,begin_checkout,web_vitals
 *   tsx scripts/src/brikette/ga4-run-report.ts --realtime --minutes 30
 *
 * Requires: .secrets/ga4/brikette-web-2b73459e229a.json (service account key)
 */

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

type ServiceAccountKey = {
  client_email: string;
  private_key: string;
  token_uri: string;
};

const DEFAULT_PROPERTY_ID = "474488225";
const DEFAULT_SA_KEY_PATH = path.resolve(
  __dirname,
  "../../../.secrets/ga4/brikette-web-2b73459e229a.json",
);

const SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"];

function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64url");
}

function createJWT(sa: ServiceAccountKey): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    scope: SCOPES.join(" "),
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

async function getAccessToken(sa: ServiceAccountKey): Promise<string> {
  const jwt = createJWT(sa);
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

function parseArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function splitCsv(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

function requireEnvLike(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function runReport(params: {
  propertyId: string;
  window: string;
  events: string[];
  saKeyPath: string;
}): Promise<unknown> {
  const saRaw = fs.readFileSync(params.saKeyPath, "utf8");
  const sa = JSON.parse(saRaw) as ServiceAccountKey;

  const token = await getAccessToken(sa);

  const [startDate, endDate] = params.window.split("..");
  if (!startDate || !endDate) {
    throw new Error(`Invalid --window "${params.window}". Expected "start..end" (e.g. "7daysAgo..today").`);
  }

  const body = {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        inListFilter: { values: params.events },
      },
    },
    limit: "1000",
  };

  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(
    params.propertyId,
  )}:runReport`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    throw new Error(`runReport failed: ${resp.status} ${await resp.text()}`);
  }
  return resp.json();
}

async function runRealtimeReport(params: {
  propertyId: string;
  minutes: number;
  events: string[];
  saKeyPath: string;
}): Promise<unknown> {
  const saRaw = fs.readFileSync(params.saKeyPath, "utf8");
  const sa = JSON.parse(saRaw) as ServiceAccountKey;

  const token = await getAccessToken(sa);

  // GA4 standard properties: realtime supports up to 29 minutes ago.
  // (360 properties can be larger; clamp so the script works everywhere.)
  const minutes = Math.max(1, Math.min(29, Math.round(params.minutes)));

  const body = {
    minuteRanges: [{ startMinutesAgo: minutes, endMinutesAgo: 0 }],
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        inListFilter: { values: params.events },
      },
    },
    limit: "1000",
  };

  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(
    params.propertyId,
  )}:runRealtimeReport`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    throw new Error(`runRealtimeReport failed: ${resp.status} ${await resp.text()}`);
  }
  return resp.json();
}

function extractEventCounts(report: any, expectedEvents: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const ev of expectedEvents) out[ev] = 0;
  const rows = Array.isArray(report?.rows) ? report.rows : [];
  for (const row of rows) {
    const name = row?.dimensionValues?.[0]?.value;
    const countStr = row?.metricValues?.[0]?.value;
    if (typeof name !== "string") continue;
    const n = Number(countStr);
    out[name] = Number.isFinite(n) ? n : 0;
  }
  return out;
}

async function main(): Promise<void> {
  const propertyId = parseArg("--property") ?? DEFAULT_PROPERTY_ID;
  const isRealtime = hasFlag("--realtime");
  const window = parseArg("--window") ?? "7daysAgo..today";
  const minutes = Number(parseArg("--minutes") ?? "30");
  const events =
    splitCsv(parseArg("--events")) ??
    ["page_view", "user_engagement", "begin_checkout", "web_vitals"];
  const saKeyPath = parseArg("--sa-key") ?? DEFAULT_SA_KEY_PATH;

  requireEnvLike(propertyId, "--property");
  if (!isRealtime) requireEnvLike(window, "--window");

  const raw = isRealtime
    ? await runRealtimeReport({ propertyId, minutes, events, saKeyPath })
    : await runReport({ propertyId, window, events, saKeyPath });
  const counts = extractEventCounts(raw, events);

  // Stable JSON for copy/paste into verification docs.
  const payload = {
    propertyId,
    report: isRealtime ? { kind: "realtime", minutes: Math.max(1, Math.min(29, Math.round(minutes))) } : { kind: "standard", window },
    extractedAt: new Date().toISOString(),
    eventCounts: counts,
    raw,
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

void main();
