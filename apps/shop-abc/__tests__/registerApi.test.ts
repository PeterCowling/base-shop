// apps/shop-abc/__tests__/registerApi.test.ts
jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

jest.mock("@auth", () => ({
  __esModule: true,
  validateCsrfToken: jest.fn(),
  getCustomerSession: jest.fn(),
}));

jest.mock("../src/middleware", () => ({
  __esModule: true,
  checkRegistrationRateLimit: jest.fn(),
}));

let profile: any;
const updateCustomerProfile = jest.fn(async (id: string, data: any) => {
  profile = { customerId: id, ...data };
  return profile;
});
const getCustomerProfile = jest.fn(async () => profile);

jest.mock("@acme/platform-core/customerProfiles", () => ({
  __esModule: true,
  updateCustomerProfile,
  getCustomerProfile,
}));

const USER_STORE: Record<string, any> = {};
const getUserById = jest.fn(async (id: string) => USER_STORE[id] ?? null);
const getUserByEmail = jest.fn(async (email: string) =>
  Object.values(USER_STORE).find((u: any) => u.email === email) ?? null,
);
const createUser = jest.fn(async ({ id, email, passwordHash }: any) => {
  USER_STORE[id] = { id, email, passwordHash };
  return USER_STORE[id];
});

jest.mock("@platform-core/users", () => ({
  __esModule: true,
  USER_STORE,
  getUserById,
  getUserByEmail,
  createUser,
}));

import { validateCsrfToken, getCustomerSession } from "@auth";
import { POST } from "../src/app/register/route";
import { GET as GETProfile } from "../src/app/api/account/profile/route";

describe("/register POST", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    profile = undefined;
    (validateCsrfToken as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    delete USER_STORE["newuser"];
  });

  it("rejects weak passwords", async () => {
    const req = {
      headers: new Headers({ "x-csrf-token": "token" }),
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

  it("accepts strong passwords", async () => {
    const req = {
      headers: new Headers({ "x-csrf-token": "token" }),
      json: async () => ({
        customerId: "newuser",
        email: "user@example.com",
        password: "Str0ngPass",
      }),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it("initializes and fetches profile", async () => {
    const req = {
      headers: new Headers({ "x-csrf-token": "token" }),
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

    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "newuser",
    });
    const getRes = await GETProfile();
    expect(getRes.status).toBe(200);
    const body = await getRes.json();
    expect(body.profile).toEqual({
      customerId: "newuser",
      name: "",
      email: "user@example.com",
    });
  });
});
