function setSession(session: any) {
  const { __setMockSession } = require('next-auth') as { __setMockSession: (s: any) => void };
  __setMockSession(session);
}

jest.mock('@cms/auth/options', () => ({ authOptions: {} }));

let mockDb: any = {};
const mockReadFile = jest.fn(async () => JSON.stringify(mockDb));
const mockRename = jest.fn(async () => {});
const mockExistsSync = jest.fn(() => true);
const mockRenameSync = jest.fn();

jest.mock('fs', () => ({
  promises: { readFile: mockReadFile, rename: mockRename },
  existsSync: mockExistsSync,
  renameSync: mockRenameSync,
}));

let consoleLogSpy: jest.SpyInstance | undefined;
beforeAll(() => {
  consoleLogSpy = jest
    .spyOn(console, 'log')
    .mockImplementation(() => {});
});

afterAll(() => {
  consoleLogSpy?.mockRestore();
});

const mockWriteJsonFile = jest.fn(async (_path: string, data: any) => {
  mockDb = data;
});

jest.mock('@/lib/server/jsonIO', () => ({ writeJsonFile: mockWriteJsonFile }));

let GET: typeof import('../route').GET;
let PUT: typeof import('../route').PUT;
let PATCH: typeof import('../route').PATCH;

beforeAll(async () => {
  ({ GET, PUT, PATCH } = await import('../route'));
});

beforeEach(() => {
  mockDb = {};
  jest.clearAllMocks();
});

function req(method: string, body?: any) {
  return new Request('http://test.local', {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('GET', () => {
  it('responds 401 when unauthorized', async () => {
    setSession(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns existing record', async () => {
    mockDb['u1'] = { state: { foo: 'bar' }, completed: { step: 'complete' } };
    setSession({ user: { id: 'u1' } });
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual(mockDb['u1']);
  });

  it('returns defaults when record missing', async () => {
    setSession({ user: { id: 'u2' } });
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ state: {}, completed: {} });
  });
});

describe('PUT', () => {
  it('responds 401 when unauthorized', async () => {
    setSession(null);
    const res = await PUT(req('PUT'));
    expect(res.status).toBe(401);
  });

  it('responds 400 on invalid body', async () => {
    setSession({ user: { id: 'u1' } });
    const res = await PUT(req('PUT', { stepId: 5 }));
    expect(res.status).toBe(400);
  });

  it('writes state and completion', async () => {
    setSession({ user: { id: 'u1' } });
    const res = await PUT(
      req('PUT', { stepId: 's1', data: { storeName: 'Shop' }, completed: 'complete' }),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mockDb).toEqual({ u1: { state: { storeName: 'Shop' }, completed: { s1: 'complete' } } });
  });

  it('handles internal TypeError', async () => {
    setSession({ user: { id: 'u1' } });
    mockWriteJsonFile.mockRejectedValueOnce(new TypeError('bad'));
    const res = await PUT(req('PUT', { stepId: 's1' }));
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'bad' });
  });
});

describe('PATCH', () => {
  it('responds 401 when unauthorized', async () => {
    setSession(null);
    const res = await PATCH(req('PATCH'));
    expect(res.status).toBe(401);
  });

  it('responds 400 on invalid body', async () => {
    setSession({ user: { id: 'u1' } });
    const res = await PATCH(req('PATCH', { stepId: 123 }));
    expect(res.status).toBe(400);
  });

  it('updates step status', async () => {
    mockDb = { u1: { state: {}, completed: {} } };
    setSession({ user: { id: 'u1' } });
    const res = await PATCH(req('PATCH', { stepId: 's1', completed: 'complete' }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(mockDb).toEqual({ u1: { state: {}, completed: { s1: 'complete' } } });
  });

  it('handles internal TypeError', async () => {
    mockDb = { u1: { state: {}, completed: {} } };
    setSession({ user: { id: 'u1' } });
    mockWriteJsonFile.mockRejectedValueOnce(new TypeError('oops'));
    const res = await PATCH(req('PATCH', { stepId: 's1', completed: 'complete' }));
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'oops' });
  });
});
