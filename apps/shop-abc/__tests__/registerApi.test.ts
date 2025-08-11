// apps/shop-abc/__tests__/registerApi.test.ts
jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init),
  },
}));

jest.mock("../src/middleware", () => ({ checkRegistrationRateLimit: jest.fn(async () => null) }));

const store: Record<string, any> = {};
jest.mock("@platform-core/users", () => ({
  getUserById: jest.fn(async (id: string) => store[id] ?? null),
  getUserByEmail: jest.fn(async (email: string) =>
    Object.values(store).find((u: any) => u.email === email) ?? null,
  ),
  createUser: jest.fn(async ({ id, email, passwordHash }: any) => {
    store[id] = { id, email, passwordHash };
  }),
}));

import { POST } from "../src/app/register/route";

describe("/register POST", () => {
  afterEach(() => {
    for (const key of Object.keys(store)) delete store[key];
  });

  it("rejects weak passwords", async () => {
    const req = {
      json: async () => ({
        customerId: "newuser",
        email: "user@example.com",
        password: "password",
      }),
      headers: new Headers(),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.password).toBeDefined();
  });

  it("accepts strong passwords", async () => {
    const req = {
      json: async () => ({
        customerId: "newuser",
        email: "user@example.com",
        password: "Str0ngPass",
      }),
      headers: new Headers(),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});
