import type { D1Database } from '@acme/platform-core/d1';

import { errorResponse, jsonResponse } from '../lib/firebase-rest';
import { getPrimeMessagingDb, hasPrimeMessagingDb } from '../lib/prime-messaging-db';
import { type PrimeReviewStatus,primeReviewStatuses } from '../lib/prime-messaging-repositories';
import { listPrimeReviewThreadSummaries } from '../lib/prime-review-api';
import { enforceStaffOwnerApiGate } from '../lib/staff-owner-gate';

interface Env {
  NODE_ENV?: string;
  PRIME_ENABLE_STAFF_OWNER_ROUTES?: string;
  PRIME_STAFF_OWNER_GATE_TOKEN?: string;
  PRIME_MESSAGING_DB?: D1Database;
}

function parseLimit(rawLimit: string | null): number | null {
  if (!rawLimit) {
    return 50;
  }

  const limit = Number.parseInt(rawLimit, 10);
  if (!Number.isFinite(limit) || limit < 1 || limit > 200) {
    return null;
  }

  return limit;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const gateResponse = enforceStaffOwnerApiGate(request, env);
  if (gateResponse) {
    return gateResponse;
  }

  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get('limit'));
  if (limit === null) {
    return errorResponse('limit must be an integer between 1 and 200', 400);
  }

  const rawStatus = url.searchParams.get('status');
  let statusFilter: PrimeReviewStatus | undefined;
  if (rawStatus !== null) {
    if (!(primeReviewStatuses as readonly string[]).includes(rawStatus)) {
      return errorResponse(`status must be one of: ${primeReviewStatuses.join(', ')}`, 400);
    }
    statusFilter = rawStatus as PrimeReviewStatus;
  }

  if (!hasPrimeMessagingDb(env)) {
    return errorResponse('PRIME_MESSAGING_DB binding is required for Prime review reads', 503);
  }

  try {
    const threads = await listPrimeReviewThreadSummaries(getPrimeMessagingDb(env), limit, statusFilter);
    return jsonResponse({
      success: true,
      data: threads,
    });
  } catch (error) {
    console.error('Failed to load Prime review threads:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return errorResponse('Failed to load Prime review threads', 500);
  }
};
