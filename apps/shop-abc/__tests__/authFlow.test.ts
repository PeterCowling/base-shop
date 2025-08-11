// apps/shop-abc/__tests__/authFlow.test.ts
import { jest } from "@jest/globals";

await jest.unstable_mockModule("@auth", () => ({
  __esModule: true,
  createCustomerSession: jest.fn(),
}));

await jest.unstable_mockModule("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init),
  },
}));

const store: Record<string, any> = {};

await jest.unstable_mockModule("@acme/platform-core/users", () => ({
  __esModule: true,
  getUser: jest.fn((id: string) => Promise.resolve(store[id] ?? null)),
  getUserByEmail: jest.fn((email: string) =>
    Promise.resolve(
      Object.values(store).find((u: any) => u.email === email) ?? null,
    ),
  ),
  createUser: jest.fn(async (data: any) => {
    store[data.customerId] = data;
    return data;
  }),
  updateUserPassword: jest.fn(async (id: string, password: string) => {
    store[id].password = password;
    return store[id];
  }),
}));

import bcrypt from "bcryptjs";
const { POST: register } = await import("../src/app/api/register/route");
const { POST: login } = await import("../src/app/login/route");
const { POST: reset } = await import("../src/app/api/password-reset/route");

describe("auth flows", () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
    jest.clearAllMocks();
  });

  it("allows sign-up, login and password reset", async () => {
    const reg = await register(
      new Request("http://test", {
        method: "POST",
        body: JSON.stringify({
          customerId: "user1",
          email: "u1@test.com",
          password: "pass1",
        }),
      }),
    );
    expect(reg.status).toBe(200);
    expect(await bcrypt.compare("pass1", store["user1"].password)).toBe(true);

    const loginOk = await login(
      new Request("http://test", {
        method: "POST",
        body: JSON.stringify({ customerId: "user1", password: "pass1" }),
      }),
    );
    expect(loginOk.status).toBe(200);

    const resetRes = await reset(
      new Request("http://test", {
        method: "POST",
        body: JSON.stringify({ email: "u1@test.com", password: "newpass" }),
      }),
    );
    expect(resetRes.status).toBe(200);

    const loginFail = await login(
      new Request("http://test", {
        method: "POST",
        body: JSON.stringify({ customerId: "user1", password: "pass1" }),
      }),
    );
    expect(loginFail.status).toBe(401);

    const loginNew = await login(
      new Request("http://test", {
        method: "POST",
        body: JSON.stringify({ customerId: "user1", password: "newpass" }),
      }),
    );
    expect(loginNew.status).toBe(200);
  });
});
