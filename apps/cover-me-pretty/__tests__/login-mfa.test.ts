// apps/cover-me-pretty/__tests__/login-mfa.test.ts
jest.mock("@acme/auth", () => ({
  __esModule: true,
  createCustomerSession: jest.fn(),
  validateCsrfToken: jest.fn(),
  isMfaEnabled: jest.fn(),
  verifyMfa: jest.fn(),
}));

import {
  createCustomerSession,
  validateCsrfToken,
  isMfaEnabled,
  verifyMfa,
} from "@acme/auth";
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
