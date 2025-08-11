// apps/shop-abc/__tests__/authFlow.test.ts
import { jest } from "@jest/globals";

jest.mock("@auth", () => ({
  createCustomerSession: jest.fn(),
  validateCsrfToken: jest.fn().mockResolvedValue(true),
}));

jest.mock("../src/middleware", () => ({
  checkLoginRateLimit: jest.fn(async () => null),
  clearLoginAttempts: jest.fn(),
}));

jest.mock("@lib/email", () => ({
  sendEmail: jest.fn(),
}));

const store: Record<string, any> = {};

jest.mock("@platform-core/users", () => ({
  getUserById: jest.fn(async (id: string) => store[id] ?? null),
  getUserByEmail: jest.fn(async (email: string) =>
    Object.values(store).find((u: any) => u.email === email) ?? null,
  ),
  createUser: jest.fn(async ({
    id,
    email,
    passwordHash,
    role = "customer",
  }: any) => {
    const user = { id, email, passwordHash, role, resetToken: null };
    store[id] = user;
    return user;
  }),
  setResetToken: jest.fn(async (id: string, token: string | null) => {
    if (store[id]) store[id].resetToken = token;
  }),
  updatePassword: jest.fn(async (id: string, hash: string) => {
    if (store[id]) {
      store[id].passwordHash = hash;
      store[id].resetToken = null;
    }
  }),
}));

let registerPOST: typeof import("../src/app/api/register/route").POST;
let loginPOST: typeof import("../src/app/login/route").POST;
let forgotPOST: typeof import("../src/app/forgot-password/route").POST;
let resetPOST: typeof import("../src/app/api/reset-password/route").POST;

beforeAll(async () => {
  ({ POST: registerPOST } = await import("../src/app/api/register/route"));
  ({ POST: loginPOST } = await import("../src/app/login/route"));
  ({ POST: forgotPOST } = await import("../src/app/forgot-password/route"));
  ({ POST: resetPOST } = await import("../src/app/api/reset-password/route"));
});

  function makeRequest(body: any, headers: Record<string, string> = {}) {
    return {
      json: async () => body,
      headers: new Headers({ "x-csrf-token": "tok", ...headers }),
    } as any;
  }

describe("auth flows", () => {
  it("allows sign-up, login and password reset", async () => {
    let res = await registerPOST(
      makeRequest({
        customerId: "cust1",
        email: "test@example.com",
        password: "pass1",
      }),
    );
    expect(res.status).toBe(200);

    const dup = await registerPOST(
      makeRequest({
        customerId: "cust2",
        email: "test@example.com",
        password: "pass2",
      }),
    );
    expect(dup.status).toBe(400);

    res = await loginPOST(
      makeRequest(
        { customerId: "cust1", password: "pass1" },
        { "x-forwarded-for": "1.1.1.1" },
      ),
    );
    expect(res.status).toBe(200);

    await forgotPOST(makeRequest({ email: "test@example.com" }));
    const { getUserById } = await import("@platform-core/users");
    const token = (await getUserById("cust1"))!.resetToken as string;

    res = await resetPOST(
      makeRequest({
        customerId: "cust1",
        token,
        password: "newpass",
      }),
    );
    expect(res.status).toBe(200);

    res = await loginPOST(
      makeRequest(
        { customerId: "cust1", password: "pass1" },
        { "x-forwarded-for": "1.1.1.1" },
      ),
    );
    expect(res.status).toBe(401);

    res = await loginPOST(
      makeRequest(
        { customerId: "cust1", password: "newpass" },
        { "x-forwarded-for": "1.1.1.1" },
      ),
    );
    expect(res.status).toBe(200);
  });
});
