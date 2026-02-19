// apps/cover-me-pretty/__tests__/login-mfa.test.ts
import {
  createCustomerSession,
  isMfaEnabled,
  validateCsrfToken,
  verifyMfa,
} from "@acme/auth";

import { POST } from "../src/app/api/login/route";

jest.mock("@acme/auth", () => ({
  __esModule: true,
  createCustomerSession: jest.fn(),
  validateCsrfToken: jest.fn(),
  isMfaEnabled: jest.fn(),
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
  return Promise.resolve(false);
}

const ORIGINAL_LOCAL_AUTH_USERS = process.env.LOCAL_AUTH_USERS;
const LOCAL_AUTH_USERS_FIXTURE = JSON.stringify({
  cust1: { passwordHash: "hash-cust1", role: "customer" },
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

test("rejects missing MFA token", async () => {
  (validateCsrfToken as jest.Mock).mockResolvedValue(true);
  (isMfaEnabled as jest.Mock).mockResolvedValue(true);
  const res = await POST(
    makeRequest(
      { customerId: "cust1", password: "pass1234" },
      { "x-csrf-token": "token" },
    ),
  );
  expect(res.status).toBe(401);
  await expect(res.json()).resolves.toEqual({ error: "MFA token required" });
  expect(verifyMfa).not.toHaveBeenCalled();
  expect(createCustomerSession).not.toHaveBeenCalled();
});

test("logs in when MFA token valid", async () => {
  (validateCsrfToken as jest.Mock).mockResolvedValue(true);
  (isMfaEnabled as jest.Mock).mockResolvedValue(true);
  (verifyMfa as jest.Mock).mockResolvedValue(true);
  const res = await POST(
    makeRequest(
      { customerId: "cust1", password: "pass1234" },
      { "x-csrf-token": "token", "x-mfa-token": "123456" },
    ),
  );
  expect(verifyMfa).toHaveBeenCalledWith("cust1", "123456");
  expect(createCustomerSession).toHaveBeenCalledWith(
    { customerId: "cust1", role: "customer" },
    { remember: undefined },
  );
  expect(res.status).toBe(200);
  await expect(res.json()).resolves.toEqual({ ok: true });
});
