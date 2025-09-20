// Central mock for @acme/config/env/core
// Provides a test-friendly `coreEnv` and `loadCoreEnv` driven by process.env
// and lightweight in-memory overrides. This avoids repeated jest.doMock calls.

type Primitive = string | number | boolean | undefined;
export type TestCoreEnv = Record<string, Primitive> & {
  NEXTAUTH_SECRET?: string;
  SESSION_SECRET?: string;
  EMAIL_FROM?: string;
  EMAIL_PROVIDER?: string;
  OPENAI_API_KEY?: string;
};

let overrides: Partial<TestCoreEnv> = Object.create(null);

export function __setCoreEnv(over: Partial<TestCoreEnv>): void {
  overrides = { ...overrides, ...over };
}

export function __resetCoreEnv(): void {
  overrides = Object.create(null);
}

function ensureFallbackSecret(value: string | undefined, fallback: string) {
  if (typeof value !== "string" || value.length < 32) return fallback;
  return value;
}

function computeCoreEnv(): TestCoreEnv {
  const env = process.env;
  // Align defaults with jest.setup.ts so types and expectations match
  const base: TestCoreEnv = {
    NEXTAUTH_SECRET: ensureFallbackSecret(
      env.NEXTAUTH_SECRET,
      "test-nextauth-secret-32-chars-long-string!",
    ),
    SESSION_SECRET: ensureFallbackSecret(
      env.SESSION_SECRET,
      "test-session-secret-32-chars-long-string!",
    ),
    EMAIL_FROM: env.EMAIL_FROM ?? "test@example.com",
    EMAIL_PROVIDER: env.EMAIL_PROVIDER ?? (env.EMAIL_FROM ? "smtp" : "noop"),
    CART_COOKIE_SECRET: env.CART_COOKIE_SECRET ?? "test-cart-secret",
    AUTH_TOKEN_TTL: (env.AUTH_TOKEN_TTL as any) ?? "15m",
    OPENAI_API_KEY: env.OPENAI_API_KEY,
  };
  return Object.assign(Object.create(null), base, overrides);
}

export function loadCoreEnv(): TestCoreEnv {
  return computeCoreEnv();
}

export const coreEnv: TestCoreEnv = new Proxy({} as TestCoreEnv, {
  get: (_t, prop: string) => (computeCoreEnv() as any)[prop],
  has: (_t, prop: string) => prop in computeCoreEnv(),
  ownKeys: () => Reflect.ownKeys(computeCoreEnv()),
  getOwnPropertyDescriptor: (_t, prop: string | symbol) =>
    Object.getOwnPropertyDescriptor(computeCoreEnv(), prop),
});

export default {} as unknown as never;

