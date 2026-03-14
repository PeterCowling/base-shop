/**
 * @jest-environment node
 *
 * Tests for POST /api/staff-broadcast-send (TASK-04)
 *
 * TC-01:  Valid request — upsert called before draft, draft before send — 200 { outcome:'sent', sentMessageId }
 * TC-01b: Cold-DB guard — upsertPrimeMessageThread called with WHOLE_HOSTEL_BROADCAST_CHANNEL_ID + audience:'whole_hostel'
 * TC-02:  Missing DB binding → 503
 * TC-03:  Empty / whitespace plainText → 400
 * TC-03b: Missing plainText key → 400
 * TC-04:  Production gate fires when not configured → 403
 * TC-05:  savePrimeReviewDraft returns not_found → 500 (invariant failure after upsert)
 * TC-06:  sendPrimeReviewThread returns conflict → 409
 * TC-07:  sendPrimeReviewThread throws → 500 + console.error called
 * TC-08:  actorSource passed to sendPrimeReviewThread is 'reception_staff_compose'
 *
 * Auth / role-gate coverage (ported from staff-initiate-thread — TC-09 through TC-14):
 * TC-09:  Unsigned request (no x-prime-actor-claims) → 401 { error: 'missing' }
 * TC-10:  Invalid signature on x-prime-actor-claims → 401 { error: 'invalid-sig' }
 * TC-11:  Missing PRIME_ACTOR_CLAIMS_SECRET → 503 { error: 'claims-secret-not-configured' }
 * TC-12:  Staff-only role (not owner/admin) → 403 { error: /insufficient role/i }
 * TC-13:  Owner role → proceeds past auth and role gate (200 or 409)
 * TC-14:  Admin role → proceeds past auth and role gate (200 or 409)
 */

import { onRequestPost as staffBroadcastSendHandler } from '../api/staff-broadcast-send';
import { upsertPrimeMessageThread } from '../lib/prime-messaging-repositories';
import { savePrimeReviewDraft } from '../lib/prime-review-drafts';
import { sendPrimeReviewThread } from '../lib/prime-review-send';

import {
  createMockD1Database,
  createMockEnv,
  createPagesContext,
  signTestActorClaims,
} from './helpers';

jest.mock('../lib/prime-review-drafts', () => ({
  savePrimeReviewDraft: jest.fn(),
}));

jest.mock('../lib/prime-review-send', () => ({
  sendPrimeReviewThread: jest.fn(),
}));

jest.mock('../lib/prime-messaging-repositories', () => ({
  upsertPrimeMessageThread: jest.fn(),
  getPrimeMessageThreadRecord: jest.fn(),
  createPrimeMessageDraft: jest.fn(),
  updatePrimeMessageDraft: jest.fn(),
  createPrimeMessage: jest.fn(),
  recordPrimeMessageAdmission: jest.fn(),
  enqueuePrimeProjectionJob: jest.fn(),
}));

const mockUpsertPrimeMessageThread = jest.mocked(upsertPrimeMessageThread);
const mockSavePrimeReviewDraft = jest.mocked(savePrimeReviewDraft);
const mockSendPrimeReviewThread = jest.mocked(sendPrimeReviewThread);

const WHOLE_HOSTEL_ID = 'broadcast_whole_hostel';

const mockDetail = {
  thread: { id: WHOLE_HOSTEL_ID },
  currentDraft: null,
  currentCampaign: null,
};

describe('POST /api/staff-broadcast-send', () => {
  beforeEach(() => {
    mockUpsertPrimeMessageThread.mockResolvedValue(undefined as never);
    mockSavePrimeReviewDraft.mockResolvedValue({
      outcome: 'updated',
      detail: mockDetail as never,
    });
    mockSendPrimeReviewThread.mockResolvedValue({
      outcome: 'sent',
      sentMessageId: 'msg_123',
      thread: { id: WHOLE_HOSTEL_ID } as never,
      draft: null as never,
      campaign: null,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('TC-01: valid request — upsert → draft → send in order — 200 with outcome:sent + sentMessageId', async () => {
    const { db } = createMockD1Database();
    const callOrder: string[] = [];
    mockUpsertPrimeMessageThread.mockImplementation(async () => {
      callOrder.push('upsert');
    });
    mockSavePrimeReviewDraft.mockImplementation(async () => {
      callOrder.push('draft');
      return { outcome: 'updated', detail: mockDetail as never };
    });
    mockSendPrimeReviewThread.mockImplementation(async () => {
      callOrder.push('send');
      return { outcome: 'sent', sentMessageId: 'msg_123', thread: { id: WHOLE_HOSTEL_ID } as never, draft: null as never, campaign: null };
    });

    const response = await staffBroadcastSendHandler(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-broadcast-send',
        method: 'POST',
        body: { plainText: 'Hello hostel!' },
        env: createMockEnv({ PRIME_MESSAGING_DB: db }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json() as { success: boolean; data: { outcome: string; sentMessageId: string } };
    expect(body.success).toBe(true);
    expect(body.data.outcome).toBe('sent');
    expect(body.data.sentMessageId).toBe('msg_123');
    expect(callOrder).toEqual(['upsert', 'draft', 'send']);
  });

  it('TC-01b: cold-DB guard — upsertPrimeMessageThread called with correct id and audience', async () => {
    const { db } = createMockD1Database();

    await staffBroadcastSendHandler(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-broadcast-send',
        method: 'POST',
        body: { plainText: 'Cold DB test' },
        env: createMockEnv({ PRIME_MESSAGING_DB: db }),
      }),
    );

    expect(mockUpsertPrimeMessageThread).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: WHOLE_HOSTEL_ID,
        audience: 'whole_hostel',
      }),
    );
  });

  it('TC-02: missing DB binding → 503', async () => {
    const response = await staffBroadcastSendHandler(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-broadcast-send',
        method: 'POST',
        body: { plainText: 'Hello hostel!' },
        env: createMockEnv(), // no PRIME_MESSAGING_DB
      }),
    );

    expect(response.status).toBe(503);
  });

  it('TC-03: whitespace-only plainText → 400', async () => {
    const { db } = createMockD1Database();

    const response = await staffBroadcastSendHandler(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-broadcast-send',
        method: 'POST',
        body: { plainText: '   ' },
        env: createMockEnv({ PRIME_MESSAGING_DB: db }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it('TC-03b: missing plainText key → 400', async () => {
    const { db } = createMockD1Database();

    const response = await staffBroadcastSendHandler(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-broadcast-send',
        method: 'POST',
        body: {},
        env: createMockEnv({ PRIME_MESSAGING_DB: db }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it('TC-04: production staff-owner gate fires when not configured → 403', async () => {
    const { db } = createMockD1Database();

    const response = await staffBroadcastSendHandler(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-broadcast-send',
        method: 'POST',
        body: { plainText: 'Auth gate test' },
        env: createMockEnv({
          PRIME_MESSAGING_DB: db,
          NODE_ENV: 'production',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
        }),
      }),
    );

    expect(response.status).toBe(403);
  });

  it('TC-05: savePrimeReviewDraft returns not_found → 500 (invariant failure after upsert, not a client 404)', async () => {
    const { db } = createMockD1Database();
    mockSavePrimeReviewDraft.mockResolvedValue({ outcome: 'not_found' });

    const response = await staffBroadcastSendHandler(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-broadcast-send',
        method: 'POST',
        body: { plainText: 'Invariant test' },
        env: createMockEnv({ PRIME_MESSAGING_DB: db }),
      }),
    );

    expect(response.status).toBe(500);
  });

  it('TC-06: sendPrimeReviewThread returns conflict → 409', async () => {
    const { db } = createMockD1Database();
    mockSendPrimeReviewThread.mockResolvedValue({ outcome: 'conflict', message: 'already sent' });

    const response = await staffBroadcastSendHandler(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-broadcast-send',
        method: 'POST',
        body: { plainText: 'Conflict test' },
        env: createMockEnv({ PRIME_MESSAGING_DB: db }),
      }),
    );

    expect(response.status).toBe(409);
  });

  it('TC-07: sendPrimeReviewThread throws → 500 and console.error called', async () => {
    const { db } = createMockD1Database();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockSendPrimeReviewThread.mockRejectedValue(new Error('Firebase unavailable'));

    const response = await staffBroadcastSendHandler(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-broadcast-send',
        method: 'POST',
        body: { plainText: 'Error test' },
        env: createMockEnv({ PRIME_MESSAGING_DB: db }),
      }),
    );

    expect(response.status).toBe(500);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('TC-08: actorSource passed to sendPrimeReviewThread is reception_staff_compose', async () => {
    const { db } = createMockD1Database();

    await staffBroadcastSendHandler(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-broadcast-send',
        method: 'POST',
        body: { plainText: 'Actor source test' },
        env: createMockEnv({ PRIME_MESSAGING_DB: db }),
      }),
    );

    expect(mockSendPrimeReviewThread).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        actorSource: 'reception_staff_compose',
      }),
    );
  });
});

describe('POST /api/staff-broadcast-send — auth and role-gate coverage (TC-09 through TC-14)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // TC-09: unsigned request → 401 missing
  it('TC-09: returns 401 when x-prime-actor-claims header is absent', async () => {
    // Suppress expected console.error from actor-claims-resolver (missing header log)
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { db } = createMockD1Database();
    const response = await staffBroadcastSendHandler(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-broadcast-send',
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        env: createMockEnv({
          NODE_ENV: 'development',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
          PRIME_MESSAGING_DB: db,
        }),
        body: { plainText: 'Hello hostel!' },
      }),
    );

    expect(response.status).toBe(401);
    const body = await response.json() as { error: string };
    expect(body.error).toBe('missing');
  });

  // TC-10: invalid signature → 401 invalid-sig
  it('TC-10: returns 401 when x-prime-actor-claims has invalid signature', async () => {
    // Suppress expected console.error from actor-claims-resolver (invalid sig log)
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { db } = createMockD1Database();
    const response = await staffBroadcastSendHandler(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-broadcast-send',
        method: 'POST',
        headers: {
          'x-prime-actor-claims': 'dGVzdA.aW52YWxpZHNpZw', // tampered payload.sig
          Authorization: 'Bearer test-token',
        },
        env: createMockEnv({
          NODE_ENV: 'development',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
          PRIME_MESSAGING_DB: db,
        }),
        body: { plainText: 'Hello hostel!' },
      }),
    );

    expect(response.status).toBe(401);
    const body = await response.json() as { error: string };
    expect(body.error).toBe('invalid-sig');
  });

  // TC-11: missing PRIME_ACTOR_CLAIMS_SECRET → 503 claims-secret-not-configured
  it('TC-11: returns 503 when PRIME_ACTOR_CLAIMS_SECRET is not configured', async () => {
    // Suppress expected console.error from actor-claims-resolver (missing secret log)
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { db } = createMockD1Database();
    const response = await staffBroadcastSendHandler(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-broadcast-send',
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        env: createMockEnv({
          NODE_ENV: 'development',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
          PRIME_MESSAGING_DB: db,
          PRIME_ACTOR_CLAIMS_SECRET: undefined,
        }),
        body: { plainText: 'Hello hostel!' },
      }),
    );

    expect(response.status).toBe(503);
    const body = await response.json() as { error: string };
    expect(body.error).toBe('claims-secret-not-configured');
  });

  // TC-12: staff-only role → 403 insufficient role
  it('TC-12: returns 403 when signed claims have staff role only (not owner/admin)', async () => {
    // Suppress expected console.error from broadcast-role-gate (insufficient role log)
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { db } = createMockD1Database();
    const claimsHeader = await signTestActorClaims('staff-uid-123', ['staff']);
    const response = await staffBroadcastSendHandler(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-broadcast-send',
        method: 'POST',
        headers: { 'x-prime-actor-claims': claimsHeader, Authorization: 'Bearer test-token' },
        env: createMockEnv({
          NODE_ENV: 'development',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
          PRIME_MESSAGING_DB: db,
        }),
        body: { plainText: 'Hello hostel!' },
      }),
    );

    expect(response.status).toBe(403);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/insufficient role/i);
  });

  // TC-13: owner role → proceeds past auth and role gate (200 or 409)
  it('TC-13: signed claims with owner role proceed past auth and role gate', async () => {
    // Suppress expected console.warn from kv-rate-limit (no KV binding in test env)
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { db } = createMockD1Database();
    const claimsHeader = await signTestActorClaims('owner-uid', ['owner']);
    const response = await staffBroadcastSendHandler(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-broadcast-send',
        method: 'POST',
        headers: { 'x-prime-actor-claims': claimsHeader, Authorization: 'Bearer test-token' },
        env: createMockEnv({
          NODE_ENV: 'development',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
          PRIME_MESSAGING_DB: db,
        }),
        body: { plainText: 'Hello hostel!' },
      }),
    );

    // Should not be a 401/403; reaches DB layer (200 or 409 with mock)
    expect([200, 409]).toContain(response.status);
  });

  // TC-14: admin role → proceeds past auth and role gate (200 or 409)
  it('TC-14: signed claims with admin role proceed past auth and role gate', async () => {
    // Suppress expected console.warn from kv-rate-limit (no KV binding in test env)
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { db } = createMockD1Database();
    const claimsHeader = await signTestActorClaims('admin-uid', ['admin']);
    const response = await staffBroadcastSendHandler(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-broadcast-send',
        method: 'POST',
        headers: { 'x-prime-actor-claims': claimsHeader, Authorization: 'Bearer test-token' },
        env: createMockEnv({
          NODE_ENV: 'development',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
          PRIME_MESSAGING_DB: db,
        }),
        body: { plainText: 'Hello hostel!' },
      }),
    );

    // Should not be a 401/403; reaches DB layer (200 or 409 with mock)
    expect([200, 409]).toContain(response.status);
  });
});
