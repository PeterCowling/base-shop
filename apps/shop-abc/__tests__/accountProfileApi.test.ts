// apps/shop-abc/__tests__/accountProfileApi.test.ts
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
  validateCsrfToken: jest.fn(),
  hasPermission: jest.requireActual("@auth/permissions").hasPermission,
}));

jest.mock("@acme/platform-core/customerProfiles", () => ({
  __esModule: true,
  getCustomerProfile: jest.fn(),
  updateCustomerProfile: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

import { getCustomerSession, validateCsrfToken } from "@auth";
import {
  getCustomerProfile,
  updateCustomerProfile,
} from "@acme/platform-core/customerProfiles";
import { GET, PUT } from "../src/app/api/account/profile/route";

describe("/api/account/profile GET", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns 401 for unauthenticated users", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns empty profile when not found", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
      role: "customer",
    });
    (getCustomerProfile as jest.Mock).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      profile: { customerId: "cust1", name: "", email: "" },
    });
  });

  it("returns profile when found", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
      role: "customer",
    });
    const profile = {
      customerId: "cust1",
      name: "Jane",
      email: "jane@test.com",
    };
    (getCustomerProfile as jest.Mock).mockResolvedValue(profile);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, profile });
  });

  it("returns 403 when lacking view_profile permission", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
      role: "viewer",
    });
    const res = await GET();
    expect(res.status).toBe(403);
  });
});

describe("/api/account/profile PUT", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("rejects requests without valid CSRF token", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
      role: "customer",
    });
    (validateCsrfToken as jest.Mock).mockResolvedValue(false);
    const req = {
      headers: new Headers(),
      json: async () => ({ name: "Jane", email: "jane@test.com" }),
    } as any;
    const res = await PUT(req);
    expect(res.status).toBe(403);
  });

  it("updates profile with valid CSRF token", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
      role: "customer",
    });
    (validateCsrfToken as jest.Mock).mockResolvedValue(true);
    const profile = { customerId: "cust1", name: "Jane", email: "jane@test.com" };
    (updateCustomerProfile as jest.Mock).mockResolvedValue(undefined);
    (getCustomerProfile as jest.Mock).mockResolvedValue(profile);
    const req = {
      headers: new Headers({ "x-csrf-token": "tok" }),
      json: async () => ({ name: "Jane", email: "jane@test.com" }),
    } as any;
    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, profile });
  });

  it("returns 409 when email already exists", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
      role: "customer",
    });
    (validateCsrfToken as jest.Mock).mockResolvedValue(true);
    (updateCustomerProfile as jest.Mock).mockRejectedValue(
      new Error("Conflict: email already in use")
    );
    const req = {
      headers: new Headers({ "x-csrf-token": "tok" }),
      json: async () => ({ name: "Jane", email: "jane@test.com" }),
    } as any;
    const res = await PUT(req);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "email already in use" });
  });

  it("returns 403 when lacking manage_profile permission", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
      role: "viewer",
    });
    (validateCsrfToken as jest.Mock).mockResolvedValue(true);
    const req = {
      headers: new Headers({ "x-csrf-token": "tok" }),
      json: async () => ({ name: "Jane", email: "jane@test.com" }),
    } as any;
    const res = await PUT(req);
    expect(res.status).toBe(403);
  });
});

