// apps/cover-me-pretty/__tests__/login-api.test.ts
jest.mock("@acme/auth", () => ({
  __esModule: true,
  createCustomerSession: jest.fn(),
  validateCsrfToken: jest.fn(),
  isMfaEnabled: jest.fn().mockResolvedValue(false),
  verifyMfa: jest.fn(),
}));

import { createCustomerSession, validateCsrfToken } from "@acme/auth";
import { POST } from "../src/app/api/login/route";

type LoginBody = {
  customerId: string;
  password: string;
  remember?: boolean;
};

function makeRequest(body: LoginBody, headers: Record<string, string> = {}) {
  return new Request("http://example.com/api/login", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

afterEach(() => jest.clearAllMocks());

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

test("rate limits after five rapid requests", async () => {
  (validateCsrfToken as jest.Mock).mockResolvedValue(true);
  const originalEnv = process.env.NODE_ENV;
  (process.env as { NODE_ENV: string }).NODE_ENV = "production";
  try {
    const body = { customerId: "cust1", password: "pass1234" };
    const headers = { "x-csrf-token": "token" };
    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest(body, headers));
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true });
    }
    const res6 = await POST(makeRequest(body, headers));
    expect(res6.status).toBe(429);
    await expect(res6.json()).resolves.toEqual({ error: "Too Many Requests" });
  } finally {
    (process.env as { NODE_ENV?: string }).NODE_ENV = originalEnv;
  }
});
