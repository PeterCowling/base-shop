// apps/shop-abc/__tests__/authFlows.test.ts
import { jest } from "@jest/globals";
import bcrypt from "bcryptjs";

jest.mock("@auth", () => ({
  createCustomerSession: jest.fn(),
}));
jest.mock("@upstash/redis", () => ({
  Redis: jest.fn(() => ({})),
}));

const sendEmail = jest.fn();
jest.mock("@lib/email", () => ({ sendEmail }));

const users: Record<string, any> = {};

const prismaMock = {
  user: {
    create: jest.fn(async ({ data }: any) => {
      users[data.id] = { ...data };
      return users[data.id];
    }),
    findUnique: jest.fn(async ({ where }: any) => {
      if (where.id) return users[where.id] ?? null;
      if (where.email)
        return (
          Object.values(users).find((u) => u.email === where.email) ?? null
        );
      return null;
    }),
    findFirst: jest.fn(async ({ where }: any) => {
      if (where.resetToken)
        return (
          Object.values(users).find((u) => u.resetToken === where.resetToken) ??
          null
        );
      return null;
    }),
    update: jest.fn(async ({ where, data }: any) => {
      Object.assign(users[where.id], data);
      return users[where.id];
    }),
  },
};

jest.mock("@platform-core/src/db", () => ({ prisma: prismaMock }));

let registerPOST: typeof import("../src/app/api/register/route").POST;
let loginPOST: typeof import("../src/app/login/route").POST;
let forgotPOST: typeof import("../src/app/forgot-password/route").POST;
let resetPOST: typeof import("../src/app/api/reset-password/route").POST;
let __resetLoginRateLimiter: typeof import("../src/middleware").__resetLoginRateLimiter;

function makeRequest(body: any, ip = "1.1.1.1") {
  return {
    json: async () => body,
    headers: new Headers({ "x-forwarded-for": ip }),
  } as any;
}

beforeAll(async () => {
  ({ POST: registerPOST } = await import("../src/app/api/register/route"));
  ({ POST: loginPOST } = await import("../src/app/login/route"));
  ({ POST: forgotPOST } = await import("../src/app/forgot-password/route"));
  ({ POST: resetPOST } = await import("../src/app/api/reset-password/route"));
  ({ __resetLoginRateLimiter } = await import("../src/middleware"));
});

beforeEach(async () => {
  for (const key of Object.keys(users)) delete users[key];
  sendEmail.mockReset();
  await __resetLoginRateLimiter();
});

describe("auth flows", () => {
  it("signs up and logs in", async () => {
    const res = await registerPOST(
      makeRequest({
        customerId: "u1",
        email: "u1@example.com",
        password: "pw1",
      }),
    );
    expect(res.status).toBe(200);
    expect(await bcrypt.compare("pw1", users["u1"].passwordHash)).toBe(true);

    const login = await loginPOST(
      makeRequest({ customerId: "u1", password: "pw1" }),
    );
    expect(login.status).toBe(200);
  });

  it("resets password", async () => {
    await registerPOST(
      makeRequest({
        customerId: "u2",
        email: "u2@example.com",
        password: "old",
      }),
    );

    await forgotPOST(makeRequest({ email: "u2@example.com" }));
    const token = users["u2"].resetToken as string;

    await resetPOST(makeRequest({ token, password: "new" }));

    const bad = await loginPOST(
      makeRequest({ customerId: "u2", password: "old" }),
    );
    expect(bad.status).toBe(401);

    const good = await loginPOST(
      makeRequest({ customerId: "u2", password: "new" }),
    );
    expect(good.status).toBe(200);
  });
});
