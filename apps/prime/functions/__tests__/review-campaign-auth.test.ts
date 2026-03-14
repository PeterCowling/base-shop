/**
 * @jest-environment node
 *
 * prime-outbound-auth-hardening: TASK-05
 * Auth coverage for review-campaign POST and PUT endpoints.
 *
 * review-campaign is a non-broadcast endpoint using resolveActorClaimsWithCompat.
 * - Missing claims + PRIME_ACTOR_CLAIMS_SECRET set → compat fallback (uid: 'prime-owner', roles: [])
 * - Present but invalid claims → 401
 * - Missing PRIME_ACTOR_CLAIMS_SECRET → 503
 * - Valid signed claims → proceeds to D1 layer
 */

import { onRequestPost as createCampaign, onRequestPut as updateCampaign } from '../api/review-campaign';

import {
  createMockD1Database,
  createMockEnv,
  createPagesContext,
  signTestActorClaims,
} from './helpers';

describe('review-campaign auth (prime-outbound-auth-hardening)', () => {
  const fetchMock = jest.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // POST /api/review-campaign

  describe('POST /api/review-campaign', () => {
    // TC-01: Valid signed claims → proceeds (reaches D1 layer; 400 for missing threadId is expected)
    it('TC-01: valid signed claims — proceeds past auth gate', async () => {
      const { db } = createMockD1Database();
      const claimsHeader = await signTestActorClaims('staff-uid', ['staff']);
      const response = await createCampaign(
        createPagesContext({
          url: 'https://prime.example.com/api/review-campaign',
          method: 'POST',
          headers: { 'x-prime-actor-claims': claimsHeader, Authorization: 'Bearer test-token' },
          env: createMockEnv({
            NODE_ENV: 'development',
            PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
            PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
            PRIME_MESSAGING_DB: db,
          }),
          body: {}, // missing threadId → 400 from business logic
        }),
      );

      // 400 means auth passed and business validation ran
      expect([200, 400, 404, 409]).toContain(response.status);
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(503);
    });

    // TC-02: Invalid signature → 401
    it('TC-02: invalid x-prime-actor-claims → 401', async () => {
      const { db } = createMockD1Database();
      const response = await createCampaign(
        createPagesContext({
          url: 'https://prime.example.com/api/review-campaign',
          method: 'POST',
          headers: {
            'x-prime-actor-claims': 'dGVzdA.aW52YWxpZA', // tampered
            Authorization: 'Bearer test-token',
          },
          env: createMockEnv({
            NODE_ENV: 'development',
            PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
            PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
            PRIME_MESSAGING_DB: db,
          }),
          body: { threadId: 'thread-1' },
        }),
      );

      expect(response.status).toBe(401);
      const body = await response.json() as { error: string };
      expect(body.error).toBe('invalid-sig');
    });

    // TC-03: PRIME_ACTOR_CLAIMS_SECRET absent → 503
    it('TC-03: PRIME_ACTOR_CLAIMS_SECRET absent → 503', async () => {
      const { db } = createMockD1Database();
      const response = await createCampaign(
        createPagesContext({
          url: 'https://prime.example.com/api/review-campaign',
          method: 'POST',
          headers: { Authorization: 'Bearer test-token' },
          env: createMockEnv({
            NODE_ENV: 'development',
            PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
            PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
            PRIME_MESSAGING_DB: db,
            PRIME_ACTOR_CLAIMS_SECRET: undefined,
          }),
          body: { threadId: 'thread-1' },
        }),
      );

      expect(response.status).toBe(503);
      const body = await response.json() as { error: string };
      expect(body.error).toBe('claims-secret-not-configured');
    });

    // TC-04: Missing claims header + secret present → compat fallback (non-broadcast endpoint)
    it('TC-04: missing claims header with secret set → compat fallback (reaches D1 layer)', async () => {
      const { db } = createMockD1Database();
      const response = await createCampaign(
        createPagesContext({
          url: 'https://prime.example.com/api/review-campaign',
          method: 'POST',
          headers: { Authorization: 'Bearer test-token' },
          env: createMockEnv({
            NODE_ENV: 'development',
            PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
            PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
            PRIME_MESSAGING_DB: db,
          }),
          body: {}, // missing threadId → 400 from business logic
        }),
      );

      // Compat fallback means auth passes; business validation fires → 400
      expect([200, 400, 404, 409]).toContain(response.status);
      expect(response.status).not.toBe(401);
    });
  });

  // PUT /api/review-campaign

  describe('PUT /api/review-campaign', () => {
    // TC-05: Valid signed claims → proceeds
    it('TC-05: valid signed claims — proceeds past auth gate', async () => {
      const { db } = createMockD1Database();
      const claimsHeader = await signTestActorClaims('staff-uid', ['staff']);
      const response = await updateCampaign(
        createPagesContext({
          url: 'https://prime.example.com/api/review-campaign?campaignId=camp_1',
          method: 'PUT',
          headers: { 'x-prime-actor-claims': claimsHeader, Authorization: 'Bearer test-token' },
          env: createMockEnv({
            NODE_ENV: 'development',
            PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
            PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
            PRIME_MESSAGING_DB: db,
          }),
          body: { status: 'drafting' },
        }),
      );

      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(503);
    });

    // TC-06: Invalid signature → 401
    it('TC-06: invalid x-prime-actor-claims → 401', async () => {
      const { db } = createMockD1Database();
      const response = await updateCampaign(
        createPagesContext({
          url: 'https://prime.example.com/api/review-campaign?campaignId=camp_1',
          method: 'PUT',
          headers: {
            'x-prime-actor-claims': 'dGVzdA.aW52YWxpZA',
            Authorization: 'Bearer test-token',
          },
          env: createMockEnv({
            NODE_ENV: 'development',
            PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
            PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
            PRIME_MESSAGING_DB: db,
          }),
          body: {},
        }),
      );

      expect(response.status).toBe(401);
      const body = await response.json() as { error: string };
      expect(body.error).toBe('invalid-sig');
    });

    // TC-07: PRIME_ACTOR_CLAIMS_SECRET absent → 503
    it('TC-07: PRIME_ACTOR_CLAIMS_SECRET absent → 503', async () => {
      const { db } = createMockD1Database();
      const response = await updateCampaign(
        createPagesContext({
          url: 'https://prime.example.com/api/review-campaign?campaignId=camp_1',
          method: 'PUT',
          headers: { Authorization: 'Bearer test-token' },
          env: createMockEnv({
            NODE_ENV: 'development',
            PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
            PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
            PRIME_MESSAGING_DB: db,
            PRIME_ACTOR_CLAIMS_SECRET: undefined,
          }),
          body: {},
        }),
      );

      expect(response.status).toBe(503);
      const body = await response.json() as { error: string };
      expect(body.error).toBe('claims-secret-not-configured');
    });
  });
});
