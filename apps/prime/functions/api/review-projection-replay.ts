import type { D1Database } from '@acme/platform-core/d1';

import { errorResponse, type FirebaseEnv, jsonResponse } from '../lib/firebase-rest';
import { getPrimeMessagingDb, hasPrimeMessagingDb } from '../lib/prime-messaging-db';
import { replayPrimeProjectionJob } from '../lib/prime-projection-replay';
import { enforceStaffOwnerApiGate } from '../lib/staff-owner-gate';

interface Env extends FirebaseEnv {
  NODE_ENV?: string;
  PRIME_ENABLE_STAFF_OWNER_ROUTES?: string;
  PRIME_STAFF_OWNER_GATE_TOKEN?: string;
  PRIME_MESSAGING_DB?: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const gateResponse = enforceStaffOwnerApiGate(request, env);
  if (gateResponse) {
    return gateResponse;
  }

  const jobId = new URL(request.url).searchParams.get('jobId')?.trim() ?? '';
  if (!jobId) {
    return errorResponse('jobId is required', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  if (!hasPrimeMessagingDb(env)) {
    return errorResponse('PRIME_MESSAGING_DB binding is required for Prime review writes', 503); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  try {
    const result = await replayPrimeProjectionJob(getPrimeMessagingDb(env), env, {
      jobId,
    });

    if (result.outcome === 'not_found') {
      return errorResponse(`Prime projection job ${jobId} not found`, 404);
    }
    if (result.outcome === 'conflict') {
      return errorResponse(result.message, 409);
    }

    return jsonResponse({
      success: true,
      data: {
        job: result.job,
      },
    });
  } catch (error) {
    console.error('Failed to replay Prime projection job:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return errorResponse('Failed to replay Prime projection job', 500);
  }
};
