// apps/cover-me-pretty/__tests__/login-api.test.ts
import { createCustomerSession, validateCsrfToken } from "@acme/auth";

import { POST } from "../src/app/api/login/route";

jest.mock("@acme/auth", () => ({
  __esModule: true,
  createCustomerSession: jest.fn(),
  validateCsrfToken: jest.fn(),
  isMfaEnabled: jest.fn().mockResolvedValue(false),
  verifyMfa: jest.fn(),
}));
jest.mock("@acme/config/env/auth", () => ({
  __esModule: true,
  authEnv: { AUTH_PROVIDER: "local" },
}));
jest.mock("argon2", () => ({
  __esModule: true,
  verify: (hash: string, password: string) => verifyArgon2(hash, password),
}));

type LoginBody = {
  customerId: string;
  password: string;
  remember?: boolean;
};

function verifyArgon2(hash: string, password: string): Promise<boolean> {
  if (hash === "hash-cust1") {
    return Promise.resolve(password === "pass1234");
  }
  if (hash === "hash-admin1") {
    return Promise.resolve(password === "admin123");
  }
  return Promise.resolve(false);
}

const ORIGINAL_LOCAL_AUTH_USERS = process.env.LOCAL_AUTH_USERS;
const LOCAL_AUTH_USERS_FIXTURE = JSON.stringify({
  cust1: { passwordHash: "hash-cust1", role: "customer" },
  admin1: { passwordHash: "hash-admin1", role: "admin" },
});

function makeRequest(body: LoginBody, headers: Record<string, string> = {}) {
  return new Request("http://example.com/api/login", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  process.env.LOCAL_AUTH_USERS = LOCAL_AUTH_USERS_FIXTURE;
  jest.clearAllMocks();
});

afterAll(() => {
  if (ORIGINAL_LOCAL_AUTH_USERS === undefined) {
    delete process.env.LOCAL_AUTH_USERS;
  } else {
    process.env.LOCAL_AUTH_USERS = ORIGINAL_LOCAL_AUTH_USERS;
  }
});

test("logs in valid customer", async () => {
  (validateCsrfToken as jest.Mock).mockResolvedValue(true);
  const res = await POST(
    makeRequest(
      { customerId: "cust1", password: "pass1234" },
      { "x-csrf-token": "token" },
    ),
  );
  expect(validateCsrfToken).toHaveBeenCalledWith("token");
  expect(createCustomerSession).toHaveBeenCalledWith({
    customerId: "cust1",
    role: "customer",
  }, { remember: undefined });
  expect(res.status).toBe(200);
  await expect(res.json()).resolves.toEqual({ ok: true });
});

test("extends session when remember is true", async () => {
  (validateCsrfToken as jest.Mock).mockResolvedValue(true);
  const res = await POST(
    makeRequest(
      { customerId: "cust1", password: "pass1234", remember: true },
      { "x-csrf-token": "token" },
    ),
  );
  expect(createCustomerSession).toHaveBeenCalledWith(
    { customerId: "cust1", role: "customer" },
    { remember: true },
  );
  expect(res.status).toBe(200);
});

test("rejects invalid CSRF token", async () => {
  (validateCsrfToken as jest.Mock).mockResolvedValue(false);
  const res = await POST(
    makeRequest(
      { customerId: "cust1", password: "pass1234" },
      { "x-csrf-token": "bad" },
    ),
  );
  expect(res.status).toBe(403);
  await expect(res.json()).resolves.toEqual({ error: "Invalid CSRF token" });
});

test("rejects invalid credentials", async () => {
  (validateCsrfToken as jest.Mock).mockResolvedValue(true);
  const res = await POST(
    makeRequest(
      { customerId: "cust1", password: "wrongpass" },
      { "x-csrf-token": "token" },
    ),
  );
  expect(res.status).toBe(401);
  const body = await res.json();
  expect(body.error).toMatch(/invalid credentials/i);
});

test("rejects unknown customer without creating session", async () => {
  (validateCsrfToken as jest.Mock).mockResolvedValue(true);
  const res = await POST(
    makeRequest(
      { customerId: "ghost", password: "pass1234" },
      { "x-csrf-token": "token" },
    ),
  );
  expect(res.status).toBe(401);
  expect(createCustomerSession).not.toHaveBeenCalled();
  expect(res.headers.get("set-cookie")).toBeNull();
  const body = await res.json();
  expect(body.error).toMatch(/invalid credentials/i);
});

test("rejects unauthorized role", async () => {
  (validateCsrfToken as jest.Mock).mockResolvedValue(true);
  const res = await POST(
    makeRequest(
      { customerId: "admin1", password: "admin123" },
      { "x-csrf-token": "token" },
    ),
  );
  expect(res.status).toBe(403);
  await expect(res.json()).resolves.toEqual({ error: "Unauthorized role" });
});

test("returns 400 for invalid body", async () => {
  (validateCsrfToken as jest.Mock).mockResolvedValue(true);
  const res = await POST(
    makeRequest(
      { customerId: "cust1", password: "short" },
      { "x-csrf-token": "token" },
    ),
  );
  expect(res.status).toBe(400);
});

test("returns 404 when NODE_ENV=production (local auth disabled)", async () => {
  const originalEnv = process.env.NODE_ENV;
  (process.env as { NODE_ENV: string }).NODE_ENV = "production";
  try {
    const res = await POST(
      makeRequest(
        { customerId: "cust1", password: "pass1234" },
        { "x-csrf-token": "token" },
      ),
    );
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Not Found" });
  } finally {
    (process.env as { NODE_ENV?: string }).NODE_ENV = originalEnv;
  }
});
