import { jest } from "@jest/globals";

type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
  maxAge?: number;
  domain?: string;
};

export interface CookieStoreMock {
  jar: Map<string, string>;
  get: jest.MockedFunction<(key: string) => { name: string; value: string } | undefined>;
  set: jest.MockedFunction<(key: string, value: string, opts?: CookieOptions) => void>;
  delete: jest.MockedFunction<(opts: { name: string; path?: string; domain?: string }) => void>;
}

export interface HeadersMock {
  get: jest.MockedFunction<(key: string) => string | null>;
}

export interface MockSessionRecord {
  sessionId: string;
  customerId: string;
  userAgent: string;
  createdAt: Date;
}

export interface SessionStoreMock {
  get: jest.MockedFunction<(id: string) => Promise<MockSessionRecord | null>>;
  set: jest.MockedFunction<(record: MockSessionRecord) => Promise<void>>;
  delete: jest.MockedFunction<(id: string) => Promise<void>>;
  list: jest.MockedFunction<(customerId: string) => Promise<MockSessionRecord[]>>;
}

interface SessionMockState {
  cookies: CookieStoreMock;
  headers: HeadersMock;
  sealData: jest.MockedFunction<
    (data: unknown, options: { password: string; ttl: number }) => Promise<string>
  >;
  unsealData: jest.MockedFunction<
    (token: string, options: { password: string; ttl: number }) => Promise<unknown>
  >;
  randomUUID: jest.MockedFunction<() => string>;
  sessionStore: SessionStoreMock;
  createSessionStoreImpl: jest.MockedFunction<() => Promise<SessionStoreMock>>;
  sessionTtlSeconds: number;
  env: {
    SESSION_SECRET?: string;
    COOKIE_DOMAIN?: string;
  };
}

function createCookieStore(): CookieStoreMock {
  const jar = new Map<string, string>();
  const store: CookieStoreMock = {
    jar,
    get: jest.fn(function get(this: CookieStoreMock, key: string) {
      const value = this.jar.get(key);
      return value ? { name: key, value } : undefined;
    }),
    set: jest.fn(function set(this: CookieStoreMock, key: string, value: string) {
      this.jar.set(key, value);
    }),
    delete: jest.fn(function del(this: CookieStoreMock, opts: { name: string }) {
      this.jar.delete(opts.name);
    }),
  };
  return store;
}

export function makeCookieStore(initial: Record<string, string> = {}): CookieStoreMock {
  const store = createCookieStore();
  for (const [key, value] of Object.entries(initial)) {
    store.jar.set(key, value);
  }
  return store;
}

function createHeaders(): HeadersMock {
  return {
    get: jest.fn(() => null),
  };
}

function createSessionStore(): SessionStoreMock {
  return {
    get: jest.fn(async () => null),
    set: jest.fn(async () => undefined),
    delete: jest.fn(async () => undefined),
    list: jest.fn(async () => []),
  };
}

export function makeSessionStore(overrides: Partial<SessionStoreMock> = {}): SessionStoreMock {
  const store = createSessionStore();
  return Object.assign(store, overrides);
}

const ORIGINAL_ENV = { ...process.env };

const state: SessionMockState = {
  cookies: createCookieStore(),
  headers: createHeaders(),
  sealData: jest.fn(async (_data: unknown, _options: { password: string; ttl: number }) => "sealed-token"),
  unsealData: jest.fn(async (_token: string, _options: { password: string; ttl: number }) => {
    throw new Error("unsealData mock not configured");
  }),
  randomUUID: jest.fn(),
  sessionStore: createSessionStore(),
  createSessionStoreImpl: jest.fn(),
  sessionTtlSeconds: 3600,
  env: {
    SESSION_SECRET: "secret",
    COOKIE_DOMAIN: "example.com",
  },
};

state.createSessionStoreImpl.mockImplementation(async () => state.sessionStore);

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => Promise.resolve(state.cookies)),
  headers: jest.fn(() => Promise.resolve(state.headers)),
}));

jest.mock("iron-session", () => ({
  sealData: state.sealData,
  unsealData: state.unsealData,
}));

jest.mock("crypto", () => ({
  randomUUID: state.randomUUID,
}));

jest.mock("@acme/config/env/core", () => ({
  coreEnv: {
    get SESSION_SECRET() {
      return state.env.SESSION_SECRET;
    },
    get COOKIE_DOMAIN() {
      return state.env.COOKIE_DOMAIN;
    },
  },
}));

jest.mock("../../src/store", () => {
  const actual = jest.requireActual<typeof import("../../src/store")>("../../src/store");
  return {
    __esModule: true,
    ...actual,
    get SESSION_TTL_S() {
      return state.sessionTtlSeconds;
    },
    createSessionStore: state.createSessionStoreImpl,
  };
});

export function resetSessionMocks(overrides?: Partial<{
  sessionSecret?: string | undefined;
  cookieDomain?: string | undefined;
  sessionTtlSeconds?: number;
}>) {
  jest.clearAllMocks();
  state.cookies = createCookieStore();
  state.headers = createHeaders();
  state.sessionStore = createSessionStore();
  state.createSessionStoreImpl.mockImplementation(async () => state.sessionStore);
  const hasTtlOverride = overrides && Object.prototype.hasOwnProperty.call(overrides, "sessionTtlSeconds");
  const hasSecretOverride = overrides && Object.prototype.hasOwnProperty.call(overrides, "sessionSecret");
  const hasDomainOverride = overrides && Object.prototype.hasOwnProperty.call(overrides, "cookieDomain");
  const overrideTtl = overrides?.sessionTtlSeconds;
  const overrideSecret = overrides?.sessionSecret;
  const overrideDomain = overrides?.cookieDomain;
  state.sessionTtlSeconds = hasTtlOverride ? overrideTtl ?? 3600 : 3600;
  state.env.SESSION_SECRET = hasSecretOverride ? overrideSecret : "secret";
  state.env.COOKIE_DOMAIN = hasDomainOverride ? overrideDomain : "example.com";
  state.sealData.mockReset();
  state.unsealData.mockReset();
  state.randomUUID.mockReset();
  state.sealData.mockResolvedValue("sealed-token");
  state.unsealData.mockRejectedValue(new Error("unsealData mock not configured"));
  state.randomUUID.mockImplementation(() => {
    throw new Error("randomUUID mock not configured");
  });
  process.env = {
    ...ORIGINAL_ENV,
    SESSION_SECRET: state.env.SESSION_SECRET,
    COOKIE_DOMAIN: state.env.COOKIE_DOMAIN,
  } as NodeJS.ProcessEnv;
}

export function restoreEnv() {
  process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
}

export async function importSessionModule() {
  jest.resetModules();
  return import("../../src/session");
}

export function primeCookie(
  name: string,
  value: string,
  options: { cookieDomain?: string } = {}
) {
  state.cookies.jar.set(name, value);
  if (options.cookieDomain) {
    state.env.COOKIE_DOMAIN = options.cookieDomain;
  }
}

export function primeSessionStore(record: MockSessionRecord) {
  state.sessionStore.get.mockResolvedValue(record);
}

export function setSessionStoreImpl(store: SessionStoreMock) {
  state.sessionStore = store;
  state.createSessionStoreImpl.mockImplementation(async () => store);
}

export function queueRandomUUIDs(ids: string[]) {
  const queue = [...ids];
  state.randomUUID.mockImplementation(() => {
    if (!queue.length) {
      throw new Error("randomUUID queue exhausted");
    }
    return queue.shift()!;
  });
}

resetSessionMocks();

export const sessionMocks = state;
