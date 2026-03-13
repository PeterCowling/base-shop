/**
 * POST /api/aggregate-kpis
 *
 * Cloudflare Pages Function that reads raw guest data from Firebase RTDB,
 * aggregates daily KPIs via kpiAggregator, and writes the result to
 * `ownerKpis/{date}` in Firebase RTDB.
 *
 * Called by the GitHub Actions cron at 02:00 UTC daily.
 * Also supports manual `workflow_dispatch` runs with a date parameter.
 *
 * Auth: Bearer secret (`PRIME_KPI_AGGREGATION_SECRET`).
 * Firebase auth: service account custom token exchanged for ID token via Identity Toolkit REST.
 */

import type { EventContext } from '@cloudflare/workers-types';

import { aggregateDailyKpis } from '../../src/lib/owner/kpiAggregator';
import { createFirebaseCustomToken } from '../lib/firebase-custom-token';
import { errorResponse,FirebaseRest, jsonResponse } from '../lib/firebase-rest';
import { enumerateGuestsByDate, projectGuestKpiData } from '../lib/kpi-projection';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AggregateKpisEnv {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
  PRIME_KPI_AGGREGATION_SECRET?: string;
  PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL?: string;
  PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY?: string;
}

// ---------------------------------------------------------------------------
// Identity Toolkit: exchange custom token for Firebase ID token
// ---------------------------------------------------------------------------

/**
 * Exchange a Firebase custom token for a Firebase ID token via Identity Toolkit REST.
 * The ID token can be used as the `auth=` param in Firebase REST API requests.
 *
 * @param customToken - Custom JWT from `createFirebaseCustomToken()`
 * @param apiKey - Firebase Web API key (CF_FIREBASE_API_KEY)
 * @returns Firebase ID token string
 * @throws On non-200 response from Identity Toolkit
 */
async function exchangeCustomTokenForIdToken(
  customToken: string,
  apiKey: string,
): Promise<string> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`;
    try {
      const body = await response.json() as { error?: { message?: string } };
      if (body?.error?.message) {
        errorDetail = body.error.message;
      }
    } catch {
      // ignore JSON parse failures
    }
    throw new Error(`Identity Toolkit token exchange failed: ${errorDetail}`);
  }

  const data = await response.json() as { idToken?: string };
  if (!data?.idToken) {
    throw new Error('Identity Toolkit response missing idToken field');
  }

  return data.idToken;
}

// ---------------------------------------------------------------------------
// Date validation
// ---------------------------------------------------------------------------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  const parsed = Date.parse(date);
  return !Number.isNaN(parsed);
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function onRequestPost(
  context: EventContext<AggregateKpisEnv, string, Record<string, unknown>>,
): Promise<Response> {
  const { request, env } = context;

  // 1. Bearer auth
  const authHeader = request.headers.get('Authorization');
  const expectedSecret = env.PRIME_KPI_AGGREGATION_SECRET;

  if (!authHeader || !expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return errorResponse('Unauthorized', 401);
  }

  // 2. Parse and validate request body
  let date: string;
  try {
    const body = await request.json() as Record<string, unknown>;
    if (typeof body?.date !== 'string' || !isValidIsoDate(body.date)) {
      return errorResponse('Invalid or missing date field (expected YYYY-MM-DD)', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }
    date = body.date;
  } catch {
    return errorResponse('Invalid JSON body', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  // 3. Validate required env vars
  const serviceAccountEmail = env.PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL;
  const serviceAccountPrivateKey = env.PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!serviceAccountEmail || !serviceAccountPrivateKey) {
    console.error('[aggregate-kpis] Missing service account credentials in environment');
    return errorResponse('Service unavailable: missing service account configuration', 503); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  // CF_FIREBASE_API_KEY is required for the Identity Toolkit exchange
  const firebaseApiKey = env.CF_FIREBASE_API_KEY;
  if (!firebaseApiKey) {
    console.error('[aggregate-kpis] Missing CF_FIREBASE_API_KEY in environment');
    return errorResponse('Service unavailable: missing Firebase API key configuration', 503); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  try {
    // 4. Create Firebase custom token (service account auth)
    const customToken = await createFirebaseCustomToken(
      {
        uid: 'svc-kpi-aggregator',
        claims: { role: 'admin' },
      },
      {
        serviceAccountEmail,
        serviceAccountPrivateKey,
      },
    );

    // 5. Exchange custom token for Firebase ID token
    const idToken = await exchangeCustomTokenForIdToken(customToken, firebaseApiKey);

    // 6. Construct authenticated FirebaseRest client
    // The ID token is passed as auth= URL param via CF_FIREBASE_API_KEY slot
    const firebase = new FirebaseRest({
      CF_FIREBASE_DATABASE_URL: env.CF_FIREBASE_DATABASE_URL,
      CF_FIREBASE_API_KEY: idToken,
    });

    // 7. Enumerate guests checking in on the date
    const { entries, enumerationPath } = await enumerateGuestsByDate(date, firebase);

    // 8. Project raw RTDB data into RawDayData
    const rawDayData = await projectGuestKpiData(date, entries, firebase);

    // 9. Aggregate KPIs
    const kpiRecord = aggregateDailyKpis(date, rawDayData);

    // 10. Write to ownerKpis/{date} (idempotent PUT)
    await firebase.set(`ownerKpis/${date}`, kpiRecord);

    // 11. Log success
    const logPayload = {
      date,
      guestCount: kpiRecord.guestCount,
      enumerationPath,
      updatedAt: kpiRecord.updatedAt,
    };
    console.info('[aggregate-kpis] success', JSON.stringify(logPayload));

    // 12. Respond
    return jsonResponse({
      success: true,
      date,
      guestCount: kpiRecord.guestCount,
      enumerationPath,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[aggregate-kpis] error', JSON.stringify({ date, error: message }));
    return errorResponse(`Aggregation failed: ${message}`, 500);
  }
}
