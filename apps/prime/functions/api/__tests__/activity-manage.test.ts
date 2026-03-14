/**
 * @jest-environment node
 */

import { createMockEnv, createPagesContext } from '../../__tests__/helpers';
import { createFirebaseCustomToken } from '../../lib/firebase-custom-token';
import { FirebaseRest } from '../../lib/firebase-rest';
import { onRequest } from '../activity-manage';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../lib/firebase-custom-token', () => ({
  createFirebaseCustomToken: jest.fn(),
}));

const mockFirebaseGet = jest.spyOn(FirebaseRest.prototype, 'get');
const mockFirebaseSet = jest.spyOn(FirebaseRest.prototype, 'set');
const mockFirebaseUpdate = jest.spyOn(FirebaseRest.prototype, 'update');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INSTANCES_PATH = 'messaging/activities/instances';
const BASE_URL = 'https://prime.example.com/api/activity-manage';

function makeEnv(overrides: Record<string, string | undefined> = {}) {
  return createMockEnv({
    PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL: 'svc@example.iam.gserviceaccount.com',
    PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY:
      '-----BEGIN PRIVATE KEY-----\nFAKE\n-----END PRIVATE KEY-----',
    ...overrides,
  });
}

function makeCtx(
  method: 'GET' | 'POST' | 'PATCH',
  body: unknown,
  headers: Record<string, string> = {},
  envOverrides: Record<string, string | undefined> = {},
) {
  if (method === 'PATCH') {
    const requestHeaders = new Headers(headers);
    if (body !== undefined) {
      requestHeaders.set('Content-Type', 'application/json');
    }
    const request = new Request(BASE_URL, {
      method: 'PATCH',
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return {
      request,
      env: makeEnv(envOverrides),
      params: {},
      data: {},
      functionPath: '',
      waitUntil: jest.fn(),
      next: jest.fn(),
    } as ReturnType<typeof createPagesContext>;
  }

  return createPagesContext({
    url: BASE_URL,
    method,
    body,
    headers,
    env: makeEnv(envOverrides),
  });
}

const VALID_POST_PAYLOAD = {
  templateId: 'tpl-1',
  title: 'Sunset Boat Tour',
  startTime: 1700000000000,
  durationMinutes: 60,
  status: 'upcoming',
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();

  (createFirebaseCustomToken as jest.Mock).mockResolvedValue('mock-custom-jwt');

  // Identity Toolkit token exchange + Firebase REST calls
  global.fetch = jest.fn().mockImplementation(async (url: unknown) => {
    if (typeof url === 'string' && url.includes('identitytoolkit.googleapis.com')) {
      return new Response(JSON.stringify({ idToken: 'mock-id-token' }), { status: 200 });
    }
    return new Response(JSON.stringify(null), { status: 200 });
  });

  mockFirebaseGet.mockResolvedValue({});
  mockFirebaseSet.mockResolvedValue(undefined);
  mockFirebaseUpdate.mockResolvedValue(undefined);
});

afterAll(() => {
  mockFirebaseGet.mockRestore();
  mockFirebaseSet.mockRestore();
  mockFirebaseUpdate.mockRestore();
});

// ---------------------------------------------------------------------------
// TC-02a: valid POST → 201, FirebaseRest.set called with correct path + payload
// ---------------------------------------------------------------------------

test('TC-02a: valid POST with durationMinutes: 60 → 201, set called with correct path and payload', async () => {
  const ctx = makeCtx('POST', VALID_POST_PAYLOAD);
  const response = await onRequest(ctx);
  const json = (await response.json()) as Record<string, unknown>;

  expect(response.status).toBe(201);
  expect(json.success).toBe(true);
  expect(typeof json.id).toBe('string');

  expect(mockFirebaseSet).toHaveBeenCalledTimes(1);
  const [setPath, setPayload] = mockFirebaseSet.mock.calls[0] as [string, Record<string, unknown>];
  expect(setPath).toMatch(new RegExp(`^${INSTANCES_PATH}/[0-9a-f-]+$`));
  expect(setPayload.durationMinutes).toBe(60);
  expect(setPayload.title).toBe('Sunset Boat Tour');
  expect(setPayload.status).toBe('upcoming');
});

// ---------------------------------------------------------------------------
// TC-02b: durationMinutes: 0 → 400
// ---------------------------------------------------------------------------

test('TC-02b: POST with durationMinutes: 0 → 400', async () => {
  const ctx = makeCtx('POST', { ...VALID_POST_PAYLOAD, durationMinutes: 0 });
  const response = await onRequest(ctx);
  const json = (await response.json()) as Record<string, unknown>;

  expect(response.status).toBe(400);
  expect(typeof json.error).toBe('string');
  expect(mockFirebaseSet).not.toHaveBeenCalled();
});

// ---------------------------------------------------------------------------
// TC-02c: production with no auth → 403
// ---------------------------------------------------------------------------

test('TC-02c: production mode, no CF Access, no secret token → 403', async () => {
  const ctx = makeCtx(
    'POST',
    VALID_POST_PAYLOAD,
    {},
    { NODE_ENV: 'production', PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false' },
  );
  const response = await onRequest(ctx);

  expect(response.status).toBe(403);
  expect(mockFirebaseSet).not.toHaveBeenCalled();
});

// ---------------------------------------------------------------------------
// TC-02d: valid PATCH → 200, FirebaseRest.update called on correct path
// ---------------------------------------------------------------------------

test('TC-02d: valid PATCH with id and durationMinutes: 90 → 200, update called on correct path', async () => {
  const instanceId = 'instance-abc-123';
  const ctx = makeCtx('PATCH', {
    id: instanceId,
    durationMinutes: 90,
    title: 'Updated Tour',
  });
  const response = await onRequest(ctx);
  const json = (await response.json()) as Record<string, unknown>;

  expect(response.status).toBe(200);
  expect(json.success).toBe(true);
  expect(json.id).toBe(instanceId);

  expect(mockFirebaseUpdate).toHaveBeenCalledTimes(1);
  const [updatePath, updatePayload] = mockFirebaseUpdate.mock.calls[0] as [
    string,
    Record<string, unknown>,
  ];
  expect(updatePath).toBe(`${INSTANCES_PATH}/${instanceId}`);
  expect(updatePayload.durationMinutes).toBe(90);
});

// ---------------------------------------------------------------------------
// TC-02e: PATCH without id → 400
// ---------------------------------------------------------------------------

test('TC-02e: PATCH without id in body → 400', async () => {
  const ctx = makeCtx('PATCH', { durationMinutes: 90 });
  const response = await onRequest(ctx);
  const json = (await response.json()) as Record<string, unknown>;

  expect(response.status).toBe(400);
  expect(typeof json.error).toBe('string');
  expect(mockFirebaseUpdate).not.toHaveBeenCalled();
});

// ---------------------------------------------------------------------------
// TC-02f: valid GET → 200, FirebaseRest.get called for instances path
// ---------------------------------------------------------------------------

test('TC-02f: valid GET → 200, get called for instances path', async () => {
  const stubInstances = {
    'id-1': {
      id: 'id-1',
      templateId: 'tpl-1',
      title: 'Morning Hike',
      startTime: 1700000000000,
      durationMinutes: 90,
      status: 'upcoming',
      createdBy: 'staff',
    },
  };
  mockFirebaseGet.mockResolvedValue(stubInstances);

  const ctx = makeCtx('GET', undefined);
  const response = await onRequest(ctx);
  const json = (await response.json()) as Record<string, unknown>;

  expect(response.status).toBe(200);
  expect(json.instances).toBeDefined();

  expect(mockFirebaseGet).toHaveBeenCalledTimes(1);
  const [getPath] = mockFirebaseGet.mock.calls[0] as [string];
  expect(getPath).toBe(INSTANCES_PATH);
});
