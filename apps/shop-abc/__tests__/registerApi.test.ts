// apps/shop-abc/__tests__/registerApi.test.ts
const USER_STORE: Record<string, any> = {};
const PROFILE_STORE: Record<string, any> = {};

jest.mock("@acme/platform-core/users", () => ({
  __esModule: true,
  createUser: jest.fn(async ({ id, email, passwordHash }) => {
    USER_STORE[id] = { id, email, passwordHash };
  }),
  getUserById: jest.fn(async (id: string) => USER_STORE[id] ?? null),
  getUserByEmail: jest.fn(async (email: string) =>
    Object.values(USER_STORE).find((u: any) => u.email === email) ?? null,
  ),
}));

const getCustomerSession = jest.fn();

jest.mock("@auth", () => ({
  validateCsrfToken: jest.fn().mockResolvedValue(true),
  getCustomerSession,
}));

jest.mock("@upstash/redis", () => ({
  Redis: jest.fn(() => ({})),
}));

jest.mock("../src/middleware", () => ({
  checkRegistrationRateLimit: jest.fn().mockResolvedValue(null),
}));

jest.mock("@acme/platform-core/customerProfiles", () => ({
  __esModule: true,
  updateCustomerProfile: jest.fn(async (id: string, data: any) => {
    PROFILE_STORE[id] = { customerId: id, ...data };
    return PROFILE_STORE[id];
  }),
  getCustomerProfile: jest.fn(async (id: string) => PROFILE_STORE[id] ?? null),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

import { POST } from "../src/app/register/route";
import { GET as profileGET } from "../src/app/api/account/profile/route";
import { updateCustomerProfile } from "@acme/platform-core/customerProfiles";

describe("/register POST", () => {
  afterEach(() => {
    for (const key of Object.keys(USER_STORE)) delete USER_STORE[key];
    for (const key of Object.keys(PROFILE_STORE)) delete PROFILE_STORE[key];
    jest.clearAllMocks();
  });

  it("rejects weak passwords", async () => {
    const req = {
      json: async () => ({
        customerId: "newuser",
        email: "user@example.com",
        password: "password",
      }),
      headers: new Headers({ "x-csrf-token": "tok" }),
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
      headers: new Headers({ "x-csrf-token": "tok" }),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it("rejects duplicate user IDs", async () => {
    const req = {
      json: async () => ({
        customerId: "newuser",
        email: "user@example.com",
        password: "Str0ngPass",
      }),
      headers: new Headers({ "x-csrf-token": "tok" }),
    } as any;
    const first = await POST(req);
    expect(first.status).toBe(200);
    const second = await POST(req);
    expect(second.status).toBe(400);
    expect(await second.json()).toEqual({ error: "User already exists" });
  });

  it("initializes profile and allows fetching", async () => {
    const req = {
      json: async () => ({
        customerId: "newuser",
        email: "user@example.com",
        password: "Str0ngPass",
      }),
      headers: new Headers({ "x-csrf-token": "tok" }),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(updateCustomerProfile).toHaveBeenCalledWith("newuser", {
      name: "",
      email: "user@example.com",
    });
    getCustomerSession.mockResolvedValue({ customerId: "newuser" });
    const profRes = await profileGET();
    expect(profRes.status).toBe(200);
    expect(await profRes.json()).toEqual({
      ok: true,
      profile: { customerId: "newuser", name: "", email: "user@example.com" },
    });
  });
});
