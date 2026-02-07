export interface MockKvNamespace {
  get: jest.Mock<Promise<string | null>, [string]>;
  put: jest.Mock<Promise<void>, [string, string, { expirationTtl: number }?]>;
  delete: jest.Mock<Promise<void>, [string]>;
}

export interface MockEnv {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY: string;
  RATE_LIMIT?: MockKvNamespace;
}

export function createMockKv(initialValues: Record<string, string> = {}): MockKvNamespace {
  const store = new Map<string, string>(Object.entries(initialValues));

  return {
    get: jest.fn(async (key: string) => store.get(key) ?? null),
    put: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    delete: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
}

export function createMockEnv(overrides: Partial<MockEnv> = {}): MockEnv {
  return {
    CF_FIREBASE_DATABASE_URL: 'https://example.firebaseio.com',
    CF_FIREBASE_API_KEY: 'test-api-key',
    ...overrides,
  };
}

export function createPagesContext({
  url,
  method = 'GET',
  body,
  headers = {},
  env = createMockEnv(),
}: {
  url: string;
  method?: 'GET' | 'POST';
  body?: unknown;
  headers?: Record<string, string>;
  env?: MockEnv;
}) {
  const requestHeaders = new Headers(headers);
  let requestBody: string | undefined;

  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(body);
  }

  const request = new Request(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
  });

  return {
    request,
    env,
    params: {},
    data: {},
    functionPath: url,
    waitUntil: jest.fn(),
    next: jest.fn(),
  } as any;
}
