import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

jest.setTimeout(20000);

// Polyfill Response.json when missing
if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers || {}) },
    });
}

// Polyfill setImmediate used by fast-csv in the test environment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).setImmediate = (fn: (...args: any[]) => void, ...args: any[]) =>
  setTimeout(fn, 0, ...args);

export async function withTempRepo(cb: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "inv-"));
  const shopDir = path.join(dir, "data", "shops", "test");
  await fs.mkdir(shopDir, { recursive: true });
  const cwd = process.cwd();
  process.chdir(dir);
  Object.assign(process.env, {
    NEXTAUTH_SECRET: "test",
    SESSION_SECRET: "test",
    CART_COOKIE_SECRET: "test-cart-secret",
    STRIPE_SECRET_KEY: "sk",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
    STRIPE_WEBHOOK_SECRET: "whsec_test",
    SKIP_STOCK_ALERT: "1",
    CMS_SPACE_URL: "http://example.com",
    CMS_ACCESS_TOKEN: "token",
    SANITY_API_VERSION: "2024-01-01",
  });
  jest.resetModules();
  try {
    await cb(dir);
  } finally {
    process.chdir(cwd);
  }
}

export function mockSessionAndEmail(): void {
  jest.doMock("next-auth", () => ({
    getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
  }));
  jest.doMock("@acme/email", () => ({ sendEmail: jest.fn() }));
}
