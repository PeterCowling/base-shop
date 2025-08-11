// apps/shop-abc/__tests__/authFlow.test.ts
import { jest } from "@jest/globals";

jest.mock("@auth", () => ({
  createCustomerSession: jest.fn(),
  validateCsrfToken: jest.fn().mockResolvedValue(true),
}));

jest.mock("@auth/mfa", () => ({
  isMfaEnabled: jest.fn().mockResolvedValue(false),
}));

jest.mock("../src/middleware", () => ({
  checkLoginRateLimit: jest.fn(async () => null),
  clearLoginAttempts: jest.fn(),
}));

jest.mock("@acme/email", () => ({
  sendEmail: jest.fn(),
}));

const store: Record<string, any> = {};

let sendEmail: jest.Mock;

jest.mock("@acme/platform-core/users", () => ({
  getUserById: jest.fn(async (id: string) => store[id] ?? null),
  getUserByEmail: jest.fn(
    async (email: string) =>
      Object.values(store).find((u: any) => u.email === email) ?? null,
  ),
  createUser: jest.fn(
    async ({ id, email, passwordHash, role = "customer" }: any) => {
      const user = {
        id,
        email,
        passwordHash,
        role,
        resetToken: null,
      };
      store[id] = user;
      return user;
    },
  ),
  setResetToken: jest.fn(async (id: string, token: string | null) => {
    if (store[id]) {
      store[id].resetToken = token;
    }
  }),
  getUserByResetToken: jest.fn(async (token: string) =>
    Object.values(store).find((u: any) => u.resetToken === token) ?? null,
  ),
  updatePassword: jest.fn(async (id: string, hash: string) => {
    if (store[id]) {
      store[id].passwordHash = hash;
      store[id].resetToken = null;
    }
  }),
}));

let registerPOST: typeof import("../src/app/api/register/route").POST;
let loginPOST: typeof import("../src/app/login/route").POST;
let requestPOST: typeof import("../src/app/api/account/reset/request/route").POST;
let completePOST: typeof import("../src/app/api/account/reset/complete/route").POST;

beforeAll(async () => {
  ({ POST: registerPOST } = await import("../src/app/api/register/route"));
  ({ POST: loginPOST } = await import("../src/app/login/route"));
  ({ POST: requestPOST } = await import(
    "../src/app/api/account/reset/request/route"
  ));
  ({ POST: completePOST } = await import(
    "../src/app/api/account/reset/complete/route"
  ));
  ({ sendEmail } = await import("@acme/email"));
});

function makeRequest(body: any, headers: Record<string, string> = {}) {
  return {
    json: async () => body,
    headers: new Headers({ "x-csrf-token": "tok", ...headers }),
  } as any;
}

describe("auth flows", () => {
  beforeEach(() => {
    for (const key in store) delete store[key];
    sendEmail.mockClear();
  });

  it("allows sign-up, login and password reset", async () => {
    let res = await registerPOST(
      makeRequest({
        customerId: "cust1",
        email: "test@example.com",
        password: "Str0ngPass1",
      })
    );
    expect(res.status).toBe(200);

    const dup = await registerPOST(
      makeRequest({
        customerId: "cust2",
        email: "test@example.com",
        password: "An0therPass1",
      })
    );
    expect(dup.status).toBe(400);

    res = await loginPOST(
      makeRequest(
        { customerId: "cust1", password: "Str0ngPass1" },
        { "x-forwarded-for": "1.1.1.1" }
      )
    );
    expect(res.status).toBe(200);

    await requestPOST(makeRequest({ email: "test@example.com" }));
    const tokenEmail = sendEmail.mock.calls[0][2] as string;
    const token = tokenEmail.replace("Your token is ", "");

    res = await completePOST(
      makeRequest({
        token,
        password: "NewStr0ng1",
      })
    );
    expect(res.status).toBe(200);

    res = await loginPOST(
      makeRequest(
        { customerId: "cust1", password: "Str0ngPass1" },
        { "x-forwarded-for": "1.1.1.1" }
      )
    );
    expect(res.status).toBe(401);

    res = await loginPOST(
      makeRequest(
        { customerId: "cust1", password: "NewStr0ng1" },
        { "x-forwarded-for": "1.1.1.1" }
      )
    );
    expect(res.status).toBe(200);
  });

  it("rejects weak passwords during reset", async () => {
    await registerPOST(
      makeRequest({
        customerId: "cust1",
        email: "test@example.com",
        password: "Str0ngPass1",
      })
    );

    await requestPOST(makeRequest({ email: "test@example.com" }));
    const tokenEmail = sendEmail.mock.calls[0][2] as string;
    const token = tokenEmail.replace("Your token is ", "");

    const res = await completePOST(
      makeRequest({
        token,
        password: "weakpass",
      })
    );
    expect(res.status).toBe(400);
  });
});
