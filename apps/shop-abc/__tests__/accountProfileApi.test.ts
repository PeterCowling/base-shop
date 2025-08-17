// apps/shop-abc/__tests__/accountProfileApi.test.ts
jest.mock("@auth", () => ({
  __esModule: true,
  requirePermission: jest.fn(),
  validateCsrfToken: jest.fn(),
}));

jest.mock("@platform-core/customerProfiles", () => ({
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

import { requirePermission, validateCsrfToken } from "@auth";
import {
  getCustomerProfile,
  updateCustomerProfile,
} from "@platform-core/customerProfiles";
import { GET, PUT } from "../src/app/api/account/profile/route";

describe("/api/account/profile GET", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns 401 for unauthenticated users", async () => {
    (requirePermission as jest.Mock).mockRejectedValue(new Error("Unauthorized"));
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns empty profile when not found", async () => {
    (requirePermission as jest.Mock).mockResolvedValue({
      customerId: "cust1",
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
    (requirePermission as jest.Mock).mockResolvedValue({
      customerId: "cust1",
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
});

describe("/api/account/profile PUT", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns 401 when permission check fails", async () => {
    (requirePermission as jest.Mock).mockRejectedValue(new Error("Unauthorized"));
    const req = {
      headers: new Headers({ "x-csrf-token": "tok" }),
      json: async () => ({ name: "Jane", email: "jane@test.com" }),
    } as any;
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it("rejects requests without valid CSRF token", async () => {
    (requirePermission as jest.Mock).mockResolvedValue({
      customerId: "cust1",
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
    (requirePermission as jest.Mock).mockResolvedValue({
      customerId: "cust1",
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
    (requirePermission as jest.Mock).mockResolvedValue({
      customerId: "cust1",
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
});

