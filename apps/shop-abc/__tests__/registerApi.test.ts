// apps/shop-abc/__tests__/registerApi.test.ts
jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init),
  },
}));

jest.mock("../src/middleware", () => ({
  checkRegistrationRateLimit: jest.fn(),
}));

import { USER_STORE } from "../src/app/userStore";

let profile: any;
jest.mock("@acme/platform-core/customerProfiles", () => ({
  __esModule: true,
  updateCustomerProfile: jest.fn(async (id: string, data: any) => {
    profile = { customerId: id, ...data };
    return profile;
  }),
  getCustomerProfile: jest.fn(async () => profile),
}));

jest.mock("@platform-core/users", () => {
  const { USER_STORE } = require("../src/app/userStore");
  return {
    __esModule: true,
    createUser: jest.fn(async ({ id, email, passwordHash }) => {
      USER_STORE[id] = { id, email, passwordHash };
      return USER_STORE[id];
    }),
    getUserById: jest.fn(async (id: string) => USER_STORE[id] ?? null),
    getUserByEmail: jest.fn(async (email: string) =>
      Object.values(USER_STORE).find((u: any) => u.email === email) ?? null,
    ),
  };
});

import { POST } from "../src/app/register/route";
import {
  updateCustomerProfile,
  getCustomerProfile,
} from "@acme/platform-core/customerProfiles";

describe("/register POST", () => {
  afterEach(() => {
    delete USER_STORE["newuser"];
    profile = undefined;
  });

  it("rejects weak passwords", async () => {
    const req = {
      headers: new Headers(),
      json: async () => ({
        customerId: "newuser",
        email: "user@example.com",
        password: "password",
      }),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.password).toBeDefined();
  });

  it("accepts strong passwords and initializes profile", async () => {
    const req = {
      headers: new Headers(),
      json: async () => ({
        customerId: "newuser",
        email: "user@example.com",
        password: "Str0ngPass",
      }),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(updateCustomerProfile).toHaveBeenCalledWith("newuser", {
      name: "",
      email: "user@example.com",
    });
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(await getCustomerProfile("newuser")).toEqual({
      customerId: "newuser",
      name: "",
      email: "user@example.com",
    });
  });
});
