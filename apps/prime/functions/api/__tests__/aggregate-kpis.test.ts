/**
 * @jest-environment node
 */

import * as kpiAggregator from '../../../src/lib/owner/kpiAggregator';
import { createMockEnv, createPagesContext } from '../../__tests__/helpers';
import { createFirebaseCustomToken } from '../../lib/firebase-custom-token';
import { FirebaseRest } from '../../lib/firebase-rest';
import * as kpiProjection from '../../lib/kpi-projection';
import { onRequestPost } from '../aggregate-kpis';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../lib/firebase-custom-token', () => ({
  createFirebaseCustomToken: jest.fn(),
}));

const mockFirebaseGet = jest.spyOn(FirebaseRest.prototype, 'get');
const mockFirebaseSet = jest.spyOn(FirebaseRest.prototype, 'set');

const mockEnumerateGuestsByDate = jest.spyOn(kpiProjection, 'enumerateGuestsByDate');
const mockProjectGuestKpiData = jest.spyOn(kpiProjection, 'projectGuestKpiData');
const mockAggregateDailyKpis = jest.spyOn(kpiAggregator, 'aggregateDailyKpis');

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const VALID_SECRET = 'test-aggregation-secret';

function makeEnv(overrides: Record<string, string | undefined> = {}) {
  return createMockEnv({
    PRIME_KPI_AGGREGATION_SECRET: VALID_SECRET,
    PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL: 'svc@example.iam.gserviceaccount.com',
    PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nFAKE\n-----END PRIVATE KEY-----',
    ...overrides,
  });
}

function makeCtx(body: unknown, headers: Record<string, string> = {}, envOverrides?: Record<string, string | undefined>) {
  return createPagesContext({
    url: 'https://prime.example.com/api/aggregate-kpis',
    method: 'POST',
    body,
    headers,
    env: makeEnv(envOverrides),
  });
}

const STUB_KPI_RECORD = {
  date: '2026-03-01',
  guestCount: 2,
  readinessCompletionPct: 75,
  etaSubmissionPct: 50,
  arrivalCodeGenPct: 100,
  medianCheckInLagMinutes: 30,
  extensionRequestCount: 0,
  bagDropRequestCount: 1,
  updatedAt: 1740000000000,
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();

  // Default happy-path mocks
  (createFirebaseCustomToken as jest.Mock).mockResolvedValue('mock-custom-jwt');

  // Mock Identity Toolkit token exchange
  global.fetch = jest.fn().mockImplementation(async (url: string) => {
    if (typeof url === 'string' && url.includes('identitytoolkit.googleapis.com')) {
      return new Response(JSON.stringify({ idToken: 'mock-id-token' }), { status: 200 });
    }
    // Firebase REST calls
    return new Response(JSON.stringify(null), { status: 200 });
  });

  mockEnumerateGuestsByDate.mockResolvedValue({
    entries: [{ uuid: 'occ1', bookingRef: 'BOOK123' }],
    enumerationPath: 'primary',
  });

  mockProjectGuestKpiData.mockResolvedValue({
    bookings: {
      BOOK123: {
        checkInDate: '2026-03-01',
        checkInCode: 'BRK-A7K9M',
        checkInAt: new Date('2026-03-01T16:30:00.000Z').getTime(),
        occupants: { occ1: { preArrival: null, extensionRequests: {}, bagDropRequests: { req_bag_001: true } } },
      },
    },
  });

  mockAggregateDailyKpis.mockReturnValue(STUB_KPI_RECORD);
  mockFirebaseSet.mockResolvedValue(undefined);
});

afterAll(() => {
  mockFirebaseGet.mockRestore();
  mockFirebaseSet.mockRestore();
  mockEnumerateGuestsByDate.mockRestore();
  mockProjectGuestKpiData.mockRestore();
  mockAggregateDailyKpis.mockRestore();
});

// ---------------------------------------------------------------------------
// TC-01: valid request → 200 with success payload
// ---------------------------------------------------------------------------

test('TC-01: valid bearer + valid date → 200 success with guestCount', async () => {
  const ctx = makeCtx(
    { date: '2026-03-01' },
    { Authorization: `Bearer ${VALID_SECRET}` },
  );

  const response = await onRequestPost(ctx);
  const json = await response.json() as Record<string, unknown>;

  expect(response.status).toBe(200);
  expect(json.success).toBe(true);
  expect(json.date).toBe('2026-03-01');
  expect(json.guestCount).toBe(2);
  expect(json.enumerationPath).toBe('primary');
});

// ---------------------------------------------------------------------------
// TC-02: missing Authorization header → 401
// ---------------------------------------------------------------------------

test('TC-02: missing Authorization header → 401', async () => {
  const ctx = makeCtx({ date: '2026-03-01' });

  const response = await onRequestPost(ctx);
  const json = await response.json() as Record<string, unknown>;

  expect(response.status).toBe(401);
  expect(json.error).toBeDefined();
});

// ---------------------------------------------------------------------------
// TC-03: wrong bearer value → 401
// ---------------------------------------------------------------------------

test('TC-03: wrong bearer secret → 401', async () => {
  const ctx = makeCtx(
    { date: '2026-03-01' },
    { Authorization: 'Bearer wrong-secret' },
  );

  const response = await onRequestPost(ctx);
  const json = await response.json() as Record<string, unknown>;

  expect(response.status).toBe(401);
  expect(json.error).toBeDefined();
});

// ---------------------------------------------------------------------------
// TC-04: invalid date format → 400
// ---------------------------------------------------------------------------

test('TC-04: invalid date format → 400', async () => {
  const ctx = makeCtx(
    { date: 'not-a-date' },
    { Authorization: `Bearer ${VALID_SECRET}` },
  );

  const response = await onRequestPost(ctx);
  const json = await response.json() as Record<string, unknown>;

  expect(response.status).toBe(400);
  expect(json.error).toBeDefined();
});

// ---------------------------------------------------------------------------
// TC-05: missing PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL env → 503
// ---------------------------------------------------------------------------

test('TC-05: missing service account email env → 503', async () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  const ctx = makeCtx(
    { date: '2026-03-01' },
    { Authorization: `Bearer ${VALID_SECRET}` },
    { PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL: undefined },
  );

  const response = await onRequestPost(ctx);
  const json = await response.json() as Record<string, unknown>;

  errorSpy.mockRestore();

  expect(response.status).toBe(503);
  expect(json.error).toBeDefined();
});

// ---------------------------------------------------------------------------
// TC-06: Identity Toolkit exchange returns non-200 → 500
// ---------------------------------------------------------------------------

test('TC-06: Identity Toolkit exchange error → 500', async () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  (createFirebaseCustomToken as jest.Mock).mockResolvedValue('mock-custom-jwt');
  global.fetch = jest.fn().mockImplementation(async (url: string) => {
    if (typeof url === 'string' && url.includes('identitytoolkit.googleapis.com')) {
      return new Response(JSON.stringify({ error: { message: 'TOKEN_EXPIRED' } }), { status: 400 });
    }
    return new Response(JSON.stringify(null), { status: 200 });
  });

  const ctx = makeCtx(
    { date: '2026-03-01' },
    { Authorization: `Bearer ${VALID_SECRET}` },
  );

  const response = await onRequestPost(ctx);
  const json = await response.json() as Record<string, unknown>;

  errorSpy.mockRestore();

  expect(response.status).toBe(500);
  expect(json.error).toBeDefined();
});

// ---------------------------------------------------------------------------
// TC-07: roomsByDate null → fallback enumeration path used, still returns 200
// ---------------------------------------------------------------------------

test('TC-07: roomsByDate null → fallback path used; 200 with enumerationPath=fallback', async () => {
  mockEnumerateGuestsByDate.mockResolvedValue({
    entries: [{ uuid: 'occ1', bookingRef: 'BOOK123' }],
    enumerationPath: 'fallback',
  });

  const ctx = makeCtx(
    { date: '2026-03-01' },
    { Authorization: `Bearer ${VALID_SECRET}` },
  );

  const response = await onRequestPost(ctx);
  const json = await response.json() as Record<string, unknown>;

  expect(response.status).toBe(200);
  expect(json.enumerationPath).toBe('fallback');
});

// ---------------------------------------------------------------------------
// TC-08: firebase.set throws → 500
// ---------------------------------------------------------------------------

test('TC-08: firebase.set throws → 500', async () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  mockFirebaseSet.mockRejectedValue(new Error('Firebase write failed'));

  const ctx = makeCtx(
    { date: '2026-03-01' },
    { Authorization: `Bearer ${VALID_SECRET}` },
  );

  const response = await onRequestPost(ctx);
  const json = await response.json() as Record<string, unknown>;

  errorSpy.mockRestore();

  expect(response.status).toBe(500);
  expect(json.error).toBeDefined();
});
