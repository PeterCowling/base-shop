/**
 * @jest-environment node
 *
 * TASK-02: POST /api/staff-initiate-thread
 * Tests the staff-initiate-thread endpoint that creates the whole-hostel broadcast
 * thread via upsert and saves a staff review draft.
 *
 * TASK-04 (prime-outbound-auth-hardening): Added actor-claims auth and role-gate coverage.
 * staff-initiate-thread is a broadcast endpoint — it uses resolveActorClaims (no compat)
 * and requires owner|admin role.
 */

import { onRequestPost as staffInitiateThread } from '../api/staff-initiate-thread';

import {
  createMockD1Database,
  createMockEnv,
  createPagesContext,
  signTestActorClaims,
  TEST_ACTOR_CLAIMS_SECRET,
} from './helpers';

describe('staff-initiate-thread (TASK-02)', () => {
  const fetchMock = jest.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // TC-01: Auth gate rejects unauthenticated request in production
  it('TC-01: rejects unauthenticated request in production (403)', async () => {
    const { db } = createMockD1Database();
    const response = await staffInitiateThread(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-initiate-thread',
        method: 'POST',
        env: createMockEnv({
          NODE_ENV: 'production',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
          PRIME_MESSAGING_DB: db,
        }),
        body: { plainText: 'Hello hostel!' },
      }),
    );

    expect(response.status).toBe(403);
  });

  // TC-02: Missing PRIME_MESSAGING_DB returns 503
  it('TC-02: returns 503 when PRIME_MESSAGING_DB is not bound', async () => {
    const claimsHeader = await signTestActorClaims('owner-uid', ['owner']);
    const response = await staffInitiateThread(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-initiate-thread',
        method: 'POST',
        headers: { 'x-prime-actor-claims': claimsHeader, Authorization: 'Bearer test-token' },
        env: createMockEnv({
          NODE_ENV: 'development',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
          // No PRIME_MESSAGING_DB
        }),
        body: { plainText: 'Hello hostel!' },
      }),
    );

    expect(response.status).toBe(503);
  });

  // TC-03: Missing plainText returns 400
  it('TC-03: returns 400 when plainText is missing', async () => {
    const { db } = createMockD1Database();
    const claimsHeader = await signTestActorClaims('owner-uid', ['owner']);
    const response = await staffInitiateThread(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-initiate-thread',
        method: 'POST',
        headers: { 'x-prime-actor-claims': claimsHeader, Authorization: 'Bearer test-token' },
        env: createMockEnv({
          NODE_ENV: 'development',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
          PRIME_MESSAGING_DB: db,
        }),
        body: {},
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/plainText is required/i);
  });

  // TC-04: Empty plainText returns 400
  it('TC-04: returns 400 when plainText is whitespace-only', async () => {
    const { db } = createMockD1Database();
    const claimsHeader = await signTestActorClaims('owner-uid', ['owner']);
    const response = await staffInitiateThread(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-initiate-thread',
        method: 'POST',
        headers: { 'x-prime-actor-claims': claimsHeader, Authorization: 'Bearer test-token' },
        env: createMockEnv({
          NODE_ENV: 'development',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
          PRIME_MESSAGING_DB: db,
        }),
        body: { plainText: '   ' },
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/plainText is required/i);
  });

  // TC-05: Invalid JSON body returns 400
  it('TC-05: returns 400 for invalid JSON body', async () => {
    const { db } = createMockD1Database();
    const claimsHeader = await signTestActorClaims('owner-uid', ['owner']);

    // createPagesContext JSON-stringifies body; bypass by sending a raw malformed string
    const env = createMockEnv({
      NODE_ENV: 'development',
      PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
      PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
      PRIME_MESSAGING_DB: db,
    });

    const request = new Request('https://prime.example.com/api/staff-initiate-thread', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-prime-actor-claims': claimsHeader,
        Authorization: 'Bearer test-token',
      },
      body: 'not-valid-json',
    });

    const response = await staffInitiateThread({
      request,
      env,
      params: {},
      data: {},
      functionPath: 'https://prime.example.com/api/staff-initiate-thread',
      waitUntil: jest.fn(),
      next: jest.fn(),
    } as any);

    expect(response.status).toBe(400);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/invalid json/i);
  });

  // TC-06: D1 error propagates as 500
  it('TC-06: returns 500 when D1 throws during upsert', async () => {
    const { db } = createMockD1Database();
    const claimsHeader = await signTestActorClaims('owner-uid', ['owner']);
    // Override prepare to simulate D1 failure
    const originalPrepare = db.prepare.bind(db);
    let callCount = 0;
    db.prepare = jest.fn((query: string) => {
      callCount++;
      // Let the gate+db-check pass (first call), fail on the actual upsert call
      if (callCount > 0) {
        const stmt = originalPrepare(query);
        stmt.run = jest.fn().mockRejectedValue(new Error('D1 runtime error'));
        stmt.first = jest.fn().mockRejectedValue(new Error('D1 runtime error'));
        return stmt;
      }
      return originalPrepare(query);
    });

    const response = await staffInitiateThread(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-initiate-thread',
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

    expect(response.status).toBe(500);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/failed to initiate staff broadcast thread/i);
  });

  // TC-07 (prime-outbound-auth-hardening): unsigned request → 401
  it('TC-07: returns 401 when x-prime-actor-claims is absent (broadcast endpoint — no compat fallback)', async () => {
    const { db } = createMockD1Database();
    const response = await staffInitiateThread(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-initiate-thread',
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

  // TC-08 (prime-outbound-auth-hardening): invalid signature → 401
  it('TC-08: returns 401 when x-prime-actor-claims has invalid signature', async () => {
    const { db } = createMockD1Database();
    const response = await staffInitiateThread(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-initiate-thread',
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

  // TC-09 (prime-outbound-auth-hardening): signed with owner role → 200 (reaches DB)
  it('TC-09: signed claims with owner role proceed past auth gate', async () => {
    const { db } = createMockD1Database();
    const claimsHeader = await signTestActorClaims('owner-uid', ['owner']);
    const response = await staffInitiateThread(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-initiate-thread',
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

    // Should not be a 401/403; D1 mock succeeds, 409 (draft conflict) or 200 expected
    expect([200, 409]).toContain(response.status);
  });

  // TC-10 (prime-outbound-auth-hardening): signed with staff role → 403
  it('TC-10: returns 403 when signed claims have staff role only (not owner/admin)', async () => {
    const { db } = createMockD1Database();
    const claimsHeader = await signTestActorClaims('staff-uid-123', ['staff']);
    const response = await staffInitiateThread(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-initiate-thread',
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

  // TC-11 (prime-outbound-auth-hardening): signed with admin role → proceeds past gate
  it('TC-11: signed claims with admin role proceed past auth and role gate', async () => {
    const { db } = createMockD1Database();
    const claimsHeader = await signTestActorClaims('admin-uid', ['admin']);
    const response = await staffInitiateThread(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-initiate-thread',
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

    // Should not be a 401/403
    expect([200, 409]).toContain(response.status);
  });

  // TC-12 (prime-outbound-auth-hardening): PRIME_ACTOR_CLAIMS_SECRET absent → 503
  it('TC-12: returns 503 when PRIME_ACTOR_CLAIMS_SECRET is not configured', async () => {
    const { db } = createMockD1Database();
    const response = await staffInitiateThread(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-initiate-thread',
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
});
