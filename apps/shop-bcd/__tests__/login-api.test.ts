// apps/shop-bcd/__tests__/login-api.test.ts
jest.mock("@auth", () => ({
  __esModule: true,
  createCustomerSession: jest.fn(),
  validateCsrfToken: jest.fn(),
  isMfaEnabled: jest.fn().mockResolvedValue(false),
  verifyMfa: jest.fn(),
}));

import {
  createCustomerSession,
  validateCsrfToken,
  isMfaEnabled,
  verifyMfa,
} from "@auth";
import { POST } from "../src/app/api/login/route";

function makeRequest(body: any, headers: Record<string, string> = {}) {
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
      { customerId: "cust1", password: "pass1pass" },
      { "x-csrf-token": "token" },
    ),
  );
  expect(validateCsrfToken).toHaveBeenCalledWith("token");
  expect(createCustomerSession).toHaveBeenCalledWith({
    customerId: "cust1",
    role: "customer",
  });
  expect(res.status).toBe(200);
  await expect(res.json()).resolves.toEqual({ ok: true });
});

test("rejects invalid CSRF token", async () => {
  (validateCsrfToken as jest.Mock).mockResolvedValue(false);
  const res = await POST(
    makeRequest(
      { customerId: "cust1", password: "pass1pass" },
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

test("rejects unauthorized role", async () => {
  (validateCsrfToken as jest.Mock).mockResolvedValue(true);
  const res = await POST(
    makeRequest(
      { customerId: "admin1", password: "adminadmin" },
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
