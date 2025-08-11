// apps/shop-abc/__tests__/authFlow.test.ts
import { jest } from "@jest/globals";
import { createHash } from "crypto";

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

jest.mock("../src/app/userStore", () => ({
  getUserById: jest.fn(async (id: string) => store[id] ?? null),
  getUserByEmail: jest.fn(async (email: string) =>
    Object.values(store).find((u: any) => u.email === email) ?? null,
  ),
  addUser: jest.fn(async ({
    id,
    email,
    passwordHash,
    role = "customer",
  }: any) => {
    const user = {
      id,
      email,
      passwordHash,
      role,
      resetTokenHash: null,
      resetTokenExpires: null,
    };
    store[id] = user;
    return user;
  }),
  setResetToken: jest.fn(
    async (id: string, tokenHash: string | null, expires: number | null) => {
      if (store[id]) {
        store[id].resetTokenHash = tokenHash;
        store[id].resetTokenExpires = expires;
      }
    },
  ),
  getUserByResetToken: jest.fn(async (token: string) => {
    const hash = createHash("sha256").update(token).digest("hex");
    return (
      Object.values(store).find(
        (u: any) =>
          u.resetTokenHash === hash &&
          u.resetTokenExpires &&
          u.resetTokenExpires > Date.now(),
      ) ?? null
    );
  }),
  updatePassword: jest.fn(async (id: string, hash: string) => {
    if (store[id]) {
      store[id].passwordHash = hash;
      store[id].resetTokenHash = null;
      store[id].resetTokenExpires = null;
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
});

  function makeRequest(body: any, headers: Record<string, string> = {}) {
    return {
      json: async () => body,
      headers: new Headers({ "x-csrf-token": "tok", ...headers }),
    } as any;
  }

describe("auth flows", () => {
  beforeEach(async () => {
    for (const key in store) delete store[key];
    const { sendEmail } = await import("@lib/email");
    (sendEmail as jest.Mock).mockReset();
  });

  it("allows sign-up, login and password reset", async () => {
    let res = await registerPOST(
      makeRequest({
        customerId: "cust1",
        email: "test@example.com",
        password: "Str0ngPass1",
      }),
    );
    expect(res.status).toBe(200);

    const dup = await registerPOST(
      makeRequest({
        customerId: "cust2",
        email: "test@example.com",
        password: "An0therPass1",
      }),
    );
    expect(dup.status).toBe(400);

    res = await loginPOST(
      makeRequest(
        { customerId: "cust1", password: "Str0ngPass1" },
        { "x-forwarded-for": "1.1.1.1" },
      ),
    );
    expect(res.status).toBe(200);

    await requestPOST(makeRequest({ email: "test@example.com" }));
    const { sendEmail } = await import("@lib/email");
    const message = (sendEmail as jest.Mock).mock.calls[0][2];
    const token = message.match(/Your token is (.+)/)[1];

    res = await completePOST(
      makeRequest({
        customerId: "cust1",
        token,
        password: "NewStr0ng1",
      }),
    );
    expect(res.status).toBe(200);

    res = await loginPOST(
      makeRequest(
        { customerId: "cust1", password: "Str0ngPass1" },
        { "x-forwarded-for": "1.1.1.1" },
      ),
    );
    expect(res.status).toBe(401);

    res = await loginPOST(
      makeRequest(
        { customerId: "cust1", password: "NewStr0ng1" },
        { "x-forwarded-for": "1.1.1.1" },
      ),
    );
    expect(res.status).toBe(200);
  });

  it("rejects weak passwords during reset", async () => {
    await registerPOST(
      makeRequest({
        customerId: "cust1",
        email: "test@example.com",
        password: "Str0ngPass1",
      }),
    );

    await requestPOST(makeRequest({ email: "test@example.com" }));
    const { sendEmail } = await import("@lib/email");
    const message = (sendEmail as jest.Mock).mock.calls[0][2];
    const token = message.match(/Your token is (.+)/)[1];

    const res = await completePOST(
      makeRequest({
        customerId: "cust1",
        token,
        password: "weakpass",
      }),
    );
    expect(res.status).toBe(400);
  });
});
