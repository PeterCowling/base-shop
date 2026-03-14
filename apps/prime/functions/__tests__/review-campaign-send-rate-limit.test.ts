/**
 * @jest-environment node
 *
 * TASK-03: KV rate limit on review-campaign-send
 * Tests the KV rate limit applied to the broadcast send endpoint.
 *
 * Updated for prime-outbound-auth-hardening: review-campaign-send is a broadcast
 * endpoint using resolveActorClaims (no compat). Tests that need to reach the rate
 * limit layer must supply a valid signed x-prime-actor-claims header with owner/admin role.
 */

import { onRequestPost as sendReviewCampaign } from '../api/review-campaign-send';

import { createMockEnv, createPagesContext, signTestActorClaims } from './helpers';

describe('review-campaign-send rate limit (TASK-03)', () => {
  const fetchMock = jest.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createKvStore(): {
    store: Map<string, { value: string; ttl?: number }>;
    kv: {
      get: jest.Mock<Promise<string | null>, [string]>;
      put: jest.Mock<Promise<void>, [string, string, { expirationTtl: number }?]>;
      delete: jest.Mock<Promise<void>, [string]>;
    };
  } {
    const store = new Map<string, { value: string; ttl?: number }>();
    const kv = {
      get: jest.fn(async (key: string): Promise<string | null> => store.get(key)?.value ?? null),
      put: jest.fn(async (key: string, value: string, opts?: { expirationTtl: number }): Promise<void> => {
        store.set(key, { value, ttl: opts?.expirationTtl });
      }),
      delete: jest.fn(async (_key: string): Promise<void> => {}),
    };
    return { store, kv };
  }

  // TC-01: RATE_LIMIT bound, first call succeeds (does not return 429)
  it('TC-01: RATE_LIMIT bound — first call returns non-429 (gate reject expected, 403)', async () => {
    const { kv } = createKvStore();
    // Production mode, no token → 403 from gate (before D1 write). This confirms rate limit
    // does not interfere with auth gate (rate limit runs after gate check).
    const response = await sendReviewCampaign(
      createPagesContext({
        url: 'https://prime.example.com/api/review-campaign-send?campaignId=camp_1',
        method: 'POST',
        env: createMockEnv({
          NODE_ENV: 'production',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
          RATE_LIMIT: kv,
        }),
      }),
    );
    // Gate returns 403 before rate limit is applied (rate limit is after gate check)
    expect(response.status).toBe(403);
  });

  // TC-02: RATE_LIMIT bound — repeated calls by same actor exceed limit and return 429
  it('TC-02: RATE_LIMIT bound — exceeds limit after 3 requests, returns 429', async () => {
    const { kv } = createKvStore();
    const env = createMockEnv({
      NODE_ENV: 'development', // bypass gateway gate
      PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
      PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
      RATE_LIMIT: kv,
    });

    // Calls 1-3: should not return 429 from rate limit (may return other errors from D1 absence)
    for (let i = 0; i < 3; i++) {
      const claimsHeader = await signTestActorClaims('owner-uid', ['owner']);
      const res = await sendReviewCampaign(
        createPagesContext({
          url: 'https://prime.example.com/api/review-campaign-send?campaignId=camp_1',
          method: 'POST',
          headers: { 'x-prime-actor-claims': claimsHeader, Authorization: 'Bearer test-token' },
          env,
        }),
      );
      expect(res.status).not.toBe(429);
    }

    // Call 4: should return 429
    const claimsHeader4 = await signTestActorClaims('owner-uid', ['owner']);
    const rateLimitedRes = await sendReviewCampaign(
      createPagesContext({
        url: 'https://prime.example.com/api/review-campaign-send?campaignId=camp_1',
        method: 'POST',
        headers: { 'x-prime-actor-claims': claimsHeader4, Authorization: 'Bearer test-token' },
        env,
      }),
    );
    expect(rateLimitedRes.status).toBe(429);
    const body = await rateLimitedRes.json() as { error: string };
    expect(body.error).toMatch(/rate limit exceeded/i);
  });

  // TC-03: RATE_LIMIT not bound — call proceeds normally (no 429, other errors possible)
  it('TC-03: RATE_LIMIT not bound — proceeds without rate limit error', async () => {
    const claimsHeader = await signTestActorClaims('owner-uid', ['owner']);
    const env = createMockEnv({
      NODE_ENV: 'development',
      PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
      PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
      // No RATE_LIMIT binding
    });

    const response = await sendReviewCampaign(
      createPagesContext({
        url: 'https://prime.example.com/api/review-campaign-send?campaignId=camp_1',
        method: 'POST',
        headers: { 'x-prime-actor-claims': claimsHeader, Authorization: 'Bearer test-token' },
        env,
      }),
    );
    // Should NOT be 429 (rate limit is absent — graceful degrade)
    expect(response.status).not.toBe(429);
  });

  // TC-04 (prime-outbound-auth-hardening): unsigned request → 401 (broadcast endpoint, no compat)
  it('TC-04: returns 401 when x-prime-actor-claims is absent (broadcast endpoint)', async () => {
    const { kv } = createKvStore();
    const response = await sendReviewCampaign(
      createPagesContext({
        url: 'https://prime.example.com/api/review-campaign-send?campaignId=camp_1',
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        env: createMockEnv({
          NODE_ENV: 'development',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
          RATE_LIMIT: kv,
        }),
      }),
    );

    expect(response.status).toBe(401);
    const body = await response.json() as { error: string };
    expect(body.error).toBe('missing');
  });

  // TC-05 (prime-outbound-auth-hardening): staff role → 403 (broadcast requires owner|admin)
  it('TC-05: returns 403 when signed claims have staff role only (broadcast requires owner/admin)', async () => {
    const { kv } = createKvStore();
    const claimsHeader = await signTestActorClaims('staff-uid-123', ['staff']);
    const response = await sendReviewCampaign(
      createPagesContext({
        url: 'https://prime.example.com/api/review-campaign-send?campaignId=camp_1',
        method: 'POST',
        headers: { 'x-prime-actor-claims': claimsHeader, Authorization: 'Bearer test-token' },
        env: createMockEnv({
          NODE_ENV: 'development',
          PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
          PRIME_STAFF_OWNER_GATE_TOKEN: 'test-token',
          RATE_LIMIT: kv,
        }),
      }),
    );

    expect(response.status).toBe(403);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/insufficient role/i);
  });
});
