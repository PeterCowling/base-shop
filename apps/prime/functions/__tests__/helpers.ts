import type { D1Database, D1PreparedStatement } from '@acme/platform-core/d1';

export interface MockKvNamespace {
  get: jest.Mock<Promise<string | null>, [string]>;
  put: jest.Mock<Promise<void>, [string, string, { expirationTtl: number }?]>;
  delete: jest.Mock<Promise<void>, [string]>;
}

export interface MockEnv {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY: string;
  PRIME_EMAIL_WEBHOOK_TOKEN?: string;
  PRIME_EMAIL_WEBHOOK_SIGNATURE_SECRET?: string;
  PRIME_EXTENSION_TARGET_EMAIL?: string;
  RATE_LIMIT?: MockKvNamespace;
  NODE_ENV?: string;
  PRIME_ENABLE_STAFF_OWNER_ROUTES?: string;
  PRIME_STAFF_OWNER_GATE_TOKEN?: string;
  PRIME_STAFF_PIN_HASH?: string;
  PRIME_STAFF_AUTH_UID?: string;
  PRIME_STAFF_AUTH_ROLE?: string;
  PRIME_STAFF_LOCKOUT_MAX_ATTEMPTS?: string;
  PRIME_STAFF_LOCKOUT_WINDOW_SECONDS?: string;
  PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL?: string;
  PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY?: string;
  PRIME_MESSAGING_DB?: D1Database;
}

export interface MockD1StatementRecord {
  query: string;
  binds: unknown[];
}

export interface MockD1DatabaseOptions {
  firstByQuery?: Record<string, unknown>;
  firstByQuerySequence?: Record<string, unknown[]>;
  allByQuery?: Record<string, unknown[]>;
  allByQuerySequence?: Record<string, unknown[][]>;
}

export function normalizeD1Query(query: string): string {
  return query.replace(/\s+/g, ' ').trim();
}

export function createMockD1Database(options: MockD1DatabaseOptions = {}): {
  db: D1Database;
  statements: MockD1StatementRecord[];
} {
  const statements: MockD1StatementRecord[] = [];
  const firstCounters = new Map<string, number>();
  const allCounters = new Map<string, number>();

  function readFirst<T>(query: string): T | null {
    const sequence = options.firstByQuerySequence?.[query];
    if (sequence && sequence.length > 0) {
      const index = firstCounters.get(query) ?? 0;
      firstCounters.set(query, index + 1);
      return (sequence[Math.min(index, sequence.length - 1)] ?? null) as T | null;
    }

    return (options.firstByQuery?.[query] ?? null) as T | null;
  }

  function readAll<T>(query: string): T[] {
    const sequence = options.allByQuerySequence?.[query];
    if (sequence && sequence.length > 0) {
      const index = allCounters.get(query) ?? 0;
      allCounters.set(query, index + 1);
      return (sequence[Math.min(index, sequence.length - 1)] ?? []) as T[];
    }

    return (options.allByQuery?.[query] ?? []) as T[];
  }

  const db: D1Database = {
    prepare(query: string): D1PreparedStatement {
      const record: MockD1StatementRecord = {
        query: normalizeD1Query(query),
        binds: [],
      };
      statements.push(record);

      const statement: D1PreparedStatement = {
        bind: (...args: unknown[]) => {
          record.binds = args;
          return statement;
        },
        all: async <T>() => ({ results: readAll<T>(record.query) }),
        first: async <T>() => readFirst<T>(record.query),
        run: async () => ({ success: true }),
      };

      return statement;
    },
    batch: async () => [],
  };

  return {
    db,
    statements,
  };
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
    PRIME_EXTENSION_TARGET_EMAIL: 'hostelbrikette@gmail.com',
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
  method?: 'GET' | 'POST' | 'PUT';
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
