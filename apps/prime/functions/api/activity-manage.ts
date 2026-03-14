/**
 * GET  /api/activity-manage — list all activity instances
 * POST /api/activity-manage — create a new activity instance
 * PATCH /api/activity-manage — update an existing activity instance
 *
 * Auth: enforceStaffOwnerApiGate (CF Access or x-prime-access-token secret).
 * Firebase auth: service account custom token → ID token via Identity Toolkit.
 */

import type { EventContext } from '@cloudflare/workers-types';

import type { ActivityInstance } from '../../src/types/messenger/activity';
import { recordDirectTelemetry } from '../lib/direct-telemetry';
import { createFirebaseCustomToken } from '../lib/firebase-custom-token';
import { exchangeCustomTokenForIdToken } from '../lib/firebase-id-token';
import { errorResponse, FirebaseRest, jsonResponse } from '../lib/firebase-rest';
import { enforceStaffOwnerApiGate } from '../lib/staff-owner-gate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActivityManageEnv {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
  PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL?: string;
  PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY?: string;
  RATE_LIMIT?: KVNamespace;
  // StaffOwnerGateEnv fields
  NODE_ENV?: string;
  PRIME_ENABLE_STAFF_OWNER_ROUTES?: string;
  PRIME_STAFF_OWNER_GATE_TOKEN?: string;
}

const INSTANCES_PATH = 'messaging/activities/instances';
const VALID_STATUSES = ['live', 'upcoming', 'archived'] as const;
type ActivityStatus = (typeof VALID_STATUSES)[number];

// ---------------------------------------------------------------------------
// Firebase client factory
// ---------------------------------------------------------------------------

async function getFirebaseClient(env: ActivityManageEnv): Promise<FirebaseRest> {
  const serviceAccountEmail = env.PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL;
  const serviceAccountPrivateKey = env.PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const firebaseApiKey = env.CF_FIREBASE_API_KEY;

  if (!serviceAccountEmail || !serviceAccountPrivateKey) {
    throw new Error('Missing Firebase service account credentials');
  }
  if (!firebaseApiKey) {
    throw new Error('Missing CF_FIREBASE_API_KEY');
  }

  const customToken = await createFirebaseCustomToken(
    { uid: 'svc-activity-manage', claims: { role: 'admin' } },
    { serviceAccountEmail, serviceAccountPrivateKey },
  );
  const idToken = await exchangeCustomTokenForIdToken(customToken, firebaseApiKey);

  return new FirebaseRest({
    CF_FIREBASE_DATABASE_URL: env.CF_FIREBASE_DATABASE_URL,
    CF_FIREBASE_API_KEY: idToken,
  });
}

// ---------------------------------------------------------------------------
// Payload validation
// ---------------------------------------------------------------------------

interface PostPayload {
  templateId: string;
  title: string;
  startTime: number;
  durationMinutes: number;
  status: ActivityStatus;
  description?: string;
  meetUpPoint?: string;
  meetUpTime?: string;
  imageUrl?: string;
  price?: number | string;
  initialMessages?: string[];
  rsvpUrl?: string;
}

interface PatchPayload {
  id: string;
  title?: string;
  startTime?: number;
  durationMinutes?: number;
  status?: ActivityStatus;
  description?: string;
  meetUpPoint?: string;
  meetUpTime?: string;
}

function validatePostPayload(body: Record<string, unknown>): PostPayload | string {
  if (typeof body.templateId !== 'string' || !body.templateId) {
    return 'templateId is required'; // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
  if (typeof body.title !== 'string' || !body.title.trim()) {
    return 'title is required'; // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
  if (typeof body.startTime !== 'number' || !Number.isFinite(body.startTime)) {
    return 'startTime must be a finite number (epoch ms)'; // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
  if (
    typeof body.durationMinutes !== 'number' ||
    !Number.isFinite(body.durationMinutes) ||
    Math.floor(body.durationMinutes) < 1
  ) {
    return 'durationMinutes must be an integer >= 1'; // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
  if (!VALID_STATUSES.includes(body.status as ActivityStatus)) {
    return `status must be one of: ${VALID_STATUSES.join(', ')}`; // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
  return body as unknown as PostPayload;
}

function validatePatchPayload(body: Record<string, unknown>): PatchPayload | string {
  if (typeof body.id !== 'string' || !body.id) {
    return 'id is required for update'; // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
  if (body.durationMinutes !== undefined) {
    if (
      typeof body.durationMinutes !== 'number' ||
      !Number.isFinite(body.durationMinutes) ||
      Math.floor(body.durationMinutes) < 1
    ) {
      return 'durationMinutes must be an integer >= 1'; // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }
  }
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status as ActivityStatus)) {
    return `status must be one of: ${VALID_STATUSES.join(', ')}`; // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
  return body as unknown as PatchPayload;
}

// ---------------------------------------------------------------------------
// Method handlers
// ---------------------------------------------------------------------------

async function handleGet(env: ActivityManageEnv): Promise<Response> {
  const firebase = await getFirebaseClient(env);
  const instances = await firebase.get<Record<string, ActivityInstance>>(INSTANCES_PATH);
  return jsonResponse({ instances: instances ?? {} });
}

async function handlePost(request: Request, env: ActivityManageEnv): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return errorResponse('Invalid JSON body', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  const validated = validatePostPayload(body);
  if (typeof validated === 'string') {
    return errorResponse(validated, 400);
  }

  const id = crypto.randomUUID();
  const accessUserEmail = request.headers.get('cf-access-authenticated-user-email');
  const createdBy = accessUserEmail ?? 'staff';
  const now = Date.now();

  const instance: ActivityInstance = {
    id,
    templateId: validated.templateId,
    title: validated.title.trim(),
    startTime: validated.startTime,
    durationMinutes: Math.max(1, Math.floor(validated.durationMinutes)),
    status: validated.status,
    createdBy,
    updatedAt: now,
    ...(validated.description !== undefined && { description: validated.description }),
    ...(validated.meetUpPoint !== undefined && { meetUpPoint: validated.meetUpPoint }),
    ...(validated.meetUpTime !== undefined && { meetUpTime: validated.meetUpTime }),
    ...(validated.imageUrl !== undefined && { imageUrl: validated.imageUrl }),
    ...(validated.price !== undefined && { price: validated.price }),
    ...(validated.initialMessages !== undefined && { initialMessages: validated.initialMessages }),
    ...(validated.rsvpUrl !== undefined && { rsvpUrl: validated.rsvpUrl }),
  };

  const firebase = await getFirebaseClient(env);
  await firebase.set(`${INSTANCES_PATH}/${id}`, instance);

  await recordDirectTelemetry(env, 'write.success');
  console.info('[activity-manage] create success', JSON.stringify({ id, createdBy, status: instance.status }));

  return jsonResponse({ success: true, id, instance }, 201);
}

async function handlePatch(request: Request, env: ActivityManageEnv): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return errorResponse('Invalid JSON body', 400); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  const validated = validatePatchPayload(body);
  if (typeof validated === 'string') {
    return errorResponse(validated, 400);
  }

  const { id, ...updates } = validated;

  const patch: Partial<ActivityInstance> = {
    ...updates,
    updatedAt: Date.now(),
    ...(updates.durationMinutes !== undefined && {
      durationMinutes: Math.max(1, Math.floor(updates.durationMinutes)),
    }),
  };

  const firebase = await getFirebaseClient(env);
  await firebase.update<ActivityInstance>(`${INSTANCES_PATH}/${id}`, patch);

  await recordDirectTelemetry(env, 'write.success');
  console.info('[activity-manage] update success', JSON.stringify({ id, fields: Object.keys(patch) }));

  return jsonResponse({ success: true, id });
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function onRequest(
  context: EventContext<ActivityManageEnv, string, Record<string, unknown>>,
): Promise<Response> {
  // Normalise the CF-specific IncomingRequestCfProperties to the standard Request type
  // used by helper functions (enforceStaffOwnerApiGate, handlePost, handlePatch).
  const { request: cfRequest, env } = context;
  const request = cfRequest as unknown as Request;
  const method = request.method.toUpperCase();

  // CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-prime-access-token',
      },
    });
  }

  // Auth gate
  const authError = enforceStaffOwnerApiGate(request, env);
  if (authError) {
    return authError;
  }

  // Validate required env var before any Firebase call
  if (!env.CF_FIREBASE_DATABASE_URL) {
    console.error('[activity-manage] Missing CF_FIREBASE_DATABASE_URL');
    return errorResponse('Service unavailable: missing Firebase configuration', 503); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  try {
    switch (method) {
      case 'GET':
        return await handleGet(env);
      case 'POST':
        return await handlePost(request, env);
      case 'PATCH':
        return await handlePatch(request, env);
      default:
        return errorResponse(`Method ${method} not allowed`, 405); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.startsWith('Missing Firebase') || message.startsWith('Missing CF_FIREBASE')) {
      console.error('[activity-manage] service config error', message);
      return errorResponse(`Service unavailable: ${message}`, 503); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }
    console.error('[activity-manage] error', JSON.stringify({ method, error: message }));
    return errorResponse(`Request failed: ${message}`, 500); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
}
