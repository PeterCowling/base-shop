/**
 * @jest-environment node
 *
 * TASK-02: POST /api/staff-initiate-thread
 * Tests the staff-initiate-thread endpoint that creates the whole-hostel broadcast
 * thread via upsert and saves a staff review draft.
 */

import { onRequestPost as staffInitiateThread } from '../api/staff-initiate-thread';

import { createMockD1Database, createMockEnv, createPagesContext } from './helpers';

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
    const response = await staffInitiateThread(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-initiate-thread',
        method: 'POST',
        headers: { 'x-prime-actor-uid': 'staff-uid-123', Authorization: 'Bearer test-token' },
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
    const response = await staffInitiateThread(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-initiate-thread',
        method: 'POST',
        headers: { 'x-prime-actor-uid': 'staff-uid-123', Authorization: 'Bearer test-token' },
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
    const response = await staffInitiateThread(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-initiate-thread',
        method: 'POST',
        headers: { 'x-prime-actor-uid': 'staff-uid-123', Authorization: 'Bearer test-token' },
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

    // createPagesContext JSON-stringifies body; bypass by sending a raw malformed string
    // We test this by constructing a request manually with invalid JSON
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
        'x-prime-actor-uid': 'staff-uid-123',
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
    // Override prepare to simulate D1 failure
    const originalPrepare = db.prepare.bind(db);
    let callCount = 0;
    db.prepare = jest.fn((query: string) => {
      callCount++;
      // Let the gate+db-check pass (first call), fail on the actual upsert call
      if (callCount > 0) {
        const stmt = originalPrepare(query);
        const origRun = stmt.run.bind(stmt);
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
        headers: { 'x-prime-actor-uid': 'staff-uid-123', Authorization: 'Bearer test-token' },
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
});
