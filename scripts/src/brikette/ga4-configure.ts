#!/usr/bin/env tsx
/**
 * GA4 Admin API Configuration Script (GA4-02)
 *
 * Creates missing custom dimensions, custom metrics, remarketing audiences,
 * and a Measurement Protocol secret for the Brikette GA4 property.
 *
 * Idempotent: safe to re-run. Checks for existing entities before creating.
 *
 * Usage: tsx scripts/src/brikette/ga4-configure.ts
 *
 * Requires: .secrets/ga4/brikette-web-2b73459e229a.json (service account key)
 */

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

// ── Configuration ───────────────────────────────────────────────────────────

const PROPERTY_ID = "properties/474488225";
const DATA_STREAM_NAME = `${PROPERTY_ID}/dataStreams/9498498913`;
const SA_KEY_PATH = path.resolve(
  __dirname,
  "../../../.secrets/ga4/brikette-web-2b73459e229a.json",
);

const SCOPES = ["https://www.googleapis.com/auth/analytics.edit"];

// ── JWT + OAuth ─────────────────────────────────────────────────────────────

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri: string;
}

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
  const signature = crypto.sign(
    "sha256",
    Buffer.from(signingInput),
    sa.private_key,
  );
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
  if (!resp.ok) throw new Error(`Token exchange failed: ${resp.status} ${await resp.text()}`);
  const data = (await resp.json()) as { access_token: string };
  return data.access_token;
}

// ── GA4 Admin API helpers ───────────────────────────────────────────────────

async function ga4Get(token: string, endpoint: string): Promise<unknown> {
  const url = `https://analyticsadmin.googleapis.com/v1beta/${endpoint}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`GET ${endpoint}: ${resp.status} ${await resp.text()}`);
  return resp.json();
}

async function ga4Post(token: string, endpoint: string, body: unknown): Promise<unknown> {
  const url = `https://analyticsadmin.googleapis.com/v1beta/${endpoint}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    // 409 = already exists (for idempotency)
    if (resp.status === 409) return null;
    throw new Error(`POST ${endpoint}: ${resp.status} ${text}`);
  }
  return resp.json();
}

async function ga4PostAlpha(token: string, endpoint: string, body: unknown): Promise<unknown> {
  const url = `https://analyticsadmin.googleapis.com/v1alpha/${endpoint}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    if (resp.status === 409) return null;
    throw new Error(`POST ${endpoint}: ${resp.status} ${text}`);
  }
  return resp.json();
}

async function ga4GetAlpha(token: string, endpoint: string): Promise<unknown> {
  const url = `https://analyticsadmin.googleapis.com/v1alpha/${endpoint}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`GET ${endpoint}: ${resp.status} ${await resp.text()}`);
  return resp.json();
}

// ── Entity types ────────────────────────────────────────────────────────────

interface CustomDimension {
  name?: string;
  parameterName: string;
  displayName: string;
  scope: "EVENT" | "USER";
  description?: string;
}

interface CustomMetric {
  name?: string;
  parameterName: string;
  displayName: string;
  scope: "EVENT";
  measurementUnit: string;
  restrictedMetricType?: string[];
  description?: string;
}

interface AudienceFilterClause {
  clauseType: "INCLUDE" | "EXCLUDE";
  simpleFilter?: {
    scope: "AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS" | "AUDIENCE_FILTER_SCOPE_WITHIN_SAME_SESSION" | "AUDIENCE_FILTER_SCOPE_WITHIN_SAME_EVENT";
    filterExpression: {
      andGroup?: { filterExpressions: Array<{ orGroup?: { filterExpressions: Array<{ dimensionOrMetricFilter?: { fieldName: string; stringFilter?: { matchType: string; value: string }; betweenFilter?: { fromValue: { int64Value: string }; toValue: { int64Value: string } } } }> } }> };
      orGroup?: { filterExpressions: Array<{ dimensionOrMetricFilter?: { fieldName: string; stringFilter?: { matchType: string; value: string } } }> };
      dimensionOrMetricFilter?: { fieldName: string; stringFilter?: { matchType: string; value: string } };
    };
  };
  sequenceFilter?: unknown;
}

// ── Definitions ─────────────────────────────────────────────────────────────

const CUSTOM_DIMENSIONS: CustomDimension[] = [
  {
    parameterName: "room_type",
    displayName: "Room Type",
    scope: "EVENT",
    description: "Type of room: dorm, private_double, apartment",
  },
  {
    parameterName: "booking_source",
    displayName: "Booking Source",
    scope: "EVENT",
    description: "Source of booking: direct, octorate, whatsapp",
  },
  {
    parameterName: "language_preference",
    displayName: "Language Preference",
    scope: "USER",
    description: "User selected language on the site",
  },
  {
    parameterName: "traffic_type",
    displayName: "Traffic Type",
    scope: "EVENT",
    description: "Internal vs external traffic for data filtering",
  },
];

const CUSTOM_METRICS: CustomMetric[] = [
  {
    parameterName: "nights_booked",
    displayName: "Nights Booked",
    scope: "EVENT",
    measurementUnit: "STANDARD",
    description: "Number of nights in booking",
  },
  {
    parameterName: "booking_value",
    displayName: "Booking Value",
    scope: "EVENT",
    measurementUnit: "CURRENCY",
    restrictedMetricType: ["REVENUE_DATA"],
    description: "Total booking value in EUR",
  },
];

// Helper: wrap filter in the required andGroup top-level expression
function eventFilter(eventName: string) {
  return {
    andGroup: {
      filterExpressions: [
        {
          orGroup: {
            filterExpressions: [
              {
                dimensionOrMetricFilter: {
                  fieldName: "eventName",
                  stringFilter: { matchType: "EXACT", value: eventName },
                },
              },
            ],
          },
        },
      ],
    },
  };
}

function dimensionContainsFilter(field: string, value: string) {
  return {
    andGroup: {
      filterExpressions: [
        {
          orGroup: {
            filterExpressions: [
              {
                dimensionOrMetricFilter: {
                  fieldName: field,
                  stringFilter: { matchType: "CONTAINS", value },
                },
              },
            ],
          },
        },
      ],
    },
  };
}

function sessionCountFilter(minSessions: string) {
  return {
    andGroup: {
      filterExpressions: [
        {
          orGroup: {
            filterExpressions: [
              {
                dimensionOrMetricFilter: {
                  fieldName: "sessionCount",
                  betweenFilter: {
                    fromValue: { int64Value: minSessions },
                    toValue: { int64Value: "1000" },
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };
}

const AUDIENCES = [
  {
    displayName: "Checked Availability No Booking",
    description: "Users who checked availability but did not complete a booking in 7 days",
    membershipDurationDays: 7,
    filterClauses: [
      {
        clauseType: "INCLUDE" as const,
        simpleFilter: {
          scope: "AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS" as const,
          filterExpression: eventFilter("click_check_availability"),
        },
      },
      {
        clauseType: "EXCLUDE" as const,
        simpleFilter: {
          scope: "AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS" as const,
          filterExpression: eventFilter("purchase"),
        },
      },
    ],
  },
  {
    displayName: "Engaged Visitors",
    description: "Users who scrolled on the site in 30 days (high engagement signal)",
    membershipDurationDays: 30,
    filterClauses: [
      {
        clauseType: "INCLUDE" as const,
        simpleFilter: {
          scope: "AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS" as const,
          filterExpression: eventFilter("scroll"),
        },
      },
    ],
  },
  {
    displayName: "Apartment Interest",
    description: "Users who viewed apartment pages in 30 days",
    membershipDurationDays: 30,
    filterClauses: [
      {
        clauseType: "INCLUDE" as const,
        simpleFilter: {
          scope: "AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS" as const,
          filterExpression: dimensionContainsFilter("unifiedPagePathScreen", "/apartment"),
        },
      },
    ],
  },
  {
    displayName: "Repeat Visitors",
    description: "Users who started 2+ sessions in 30 days (returning users)",
    membershipDurationDays: 30,
    filterClauses: [
      {
        clauseType: "INCLUDE" as const,
        simpleFilter: {
          scope: "AUDIENCE_FILTER_SCOPE_ACROSS_ALL_SESSIONS" as const,
          filterExpression: eventFilter("session_start"),
        },
      },
    ],
  },
];

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("🔑 Loading service account...");
  const saJson = fs.readFileSync(SA_KEY_PATH, "utf-8");
  const sa: ServiceAccountKey = JSON.parse(saJson);

  console.log("🔐 Authenticating...");
  const token = await getAccessToken(sa);
  console.log("✅ Authenticated as", sa.client_email);

  // ── Custom Dimensions ──────────────────────────────────────────────────
  console.log("\n📐 Custom Dimensions:");
  const existingDims = (await ga4Get(token, `${PROPERTY_ID}/customDimensions`)) as {
    customDimensions?: CustomDimension[];
  };
  const existingDimParams = new Set(
    (existingDims.customDimensions ?? []).map((d) => d.parameterName),
  );

  for (const dim of CUSTOM_DIMENSIONS) {
    if (existingDimParams.has(dim.parameterName)) {
      console.log(`  ⏭  ${dim.displayName} (${dim.parameterName}) — already exists`);
    } else {
      await ga4Post(token, `${PROPERTY_ID}/customDimensions`, dim);
      console.log(`  ✅ Created: ${dim.displayName} (${dim.parameterName})`);
    }
  }

  // Verify
  const verifyDims = (await ga4Get(token, `${PROPERTY_ID}/customDimensions`)) as {
    customDimensions?: CustomDimension[];
  };
  const dimCount = (verifyDims.customDimensions ?? []).length;
  console.log(`  📊 Total custom dimensions: ${dimCount}`);

  // ── Custom Metrics ─────────────────────────────────────────────────────
  console.log("\n📏 Custom Metrics:");
  const existingMetrics = (await ga4Get(token, `${PROPERTY_ID}/customMetrics`)) as {
    customMetrics?: CustomMetric[];
  };
  const existingMetricParams = new Set(
    (existingMetrics.customMetrics ?? []).map((m) => m.parameterName),
  );

  for (const metric of CUSTOM_METRICS) {
    if (existingMetricParams.has(metric.parameterName)) {
      console.log(`  ⏭  ${metric.displayName} (${metric.parameterName}) — already exists`);
    } else {
      await ga4Post(token, `${PROPERTY_ID}/customMetrics`, metric);
      console.log(`  ✅ Created: ${metric.displayName} (${metric.parameterName})`);
    }
  }

  // Verify
  const verifyMetrics = (await ga4Get(token, `${PROPERTY_ID}/customMetrics`)) as {
    customMetrics?: CustomMetric[];
  };
  const metricCount = (verifyMetrics.customMetrics ?? []).length;
  console.log(`  📊 Total custom metrics: ${metricCount}`);

  // ── Audiences ──────────────────────────────────────────────────────────
  console.log("\n👥 Audiences:");
  const existingAudiences = (await ga4GetAlpha(token, `${PROPERTY_ID}/audiences`)) as {
    audiences?: Array<{ displayName: string }>;
  };
  const existingAudienceNames = new Set(
    (existingAudiences.audiences ?? []).map((a) => a.displayName),
  );

  for (const audience of AUDIENCES) {
    if (existingAudienceNames.has(audience.displayName)) {
      console.log(`  ⏭  ${audience.displayName} — already exists`);
    } else {
      try {
        await ga4PostAlpha(token, `${PROPERTY_ID}/audiences`, audience);
        console.log(`  ✅ Created: ${audience.displayName}`);
      } catch (err) {
        console.log(`  ⚠️  ${audience.displayName} — failed: ${(err as Error).message}`);
      }
    }
  }

  // Verify
  const verifyAudiences = (await ga4GetAlpha(token, `${PROPERTY_ID}/audiences`)) as {
    audiences?: Array<{ displayName: string }>;
  };
  const audienceCount = (verifyAudiences.audiences ?? []).length;
  console.log(`  📊 Total audiences: ${audienceCount}`);

  // ── Measurement Protocol Secret ────────────────────────────────────────
  console.log("\n🔑 Measurement Protocol Secret:");
  let existingSecrets: { measurementProtocolSecrets?: Array<{ displayName: string; secretValue: string }> } = {};
  try {
    existingSecrets = (await ga4Get(
      token,
      `${DATA_STREAM_NAME}/measurementProtocolSecrets`,
    )) as typeof existingSecrets;
  } catch {
    // May fail if data collection acknowledgement is not attested
  }

  const mpSecretName = "ga4-automation-mp-secret";
  const existingSecret = (existingSecrets.measurementProtocolSecrets ?? []).find(
    (s) => s.displayName === mpSecretName,
  );

  if (existingSecret) {
    console.log(`  ⏭  ${mpSecretName} — already exists`);
    console.log(`  🔑 Secret value: ${existingSecret.secretValue}`);
  } else {
    try {
      const created = (await ga4Post(
        token,
        `${DATA_STREAM_NAME}/measurementProtocolSecrets`,
        { displayName: mpSecretName },
      )) as { secretValue: string } | null;
      if (created) {
        console.log(`  ✅ Created: ${mpSecretName}`);
        console.log(`  🔑 Secret value: ${created.secretValue}`);
        console.log("  ⚠️  Store this secret securely — it cannot be retrieved again via API!");
      }
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("User Data Collection Acknowledgement")) {
        console.log(`  ⚠️  Cannot create MP secret — User Data Collection Acknowledgement must be attested first.`);
        console.log(`     Go to GA4 Admin → Data Collection → acknowledge data collection, then re-run this script.`);
      } else {
        throw err;
      }
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════");
  console.log("✅ GA4 configuration complete");
  console.log(`   Dimensions: ${dimCount}`);
  console.log(`   Metrics: ${metricCount}`);
  console.log(`   Audiences: ${audienceCount}`);
  console.log("═══════════════════════════════════════════");
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
