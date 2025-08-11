// apps/shop-abc/__tests__/accountProfileApi.test.ts
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
  validateCsrfToken: jest.fn(),
}));

jest.mock("@acme/platform-core", () => ({
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
import { getCustomerProfile } from "@acme/platform-core";
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

  it("returns 404 when profile not found", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
    });
    (getCustomerProfile as jest.Mock).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns profile when found", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
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

  const body = { name: "Jane", email: "jane@test.com" };

  it("returns 403 when CSRF token is missing", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "cust1" });
    (validateCsrfToken as jest.Mock).mockResolvedValue(false);
    const req = { headers: new Headers(), json: async () => body } as any;
    const res = await PUT(req);
    expect(validateCsrfToken).toHaveBeenCalledWith(null);
    expect(res.status).toBe(403);
  });

  it("updates profile when CSRF token is valid", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "cust1" });
    (validateCsrfToken as jest.Mock).mockResolvedValue(true);
    const profile = { customerId: "cust1", ...body };
    (getCustomerProfile as jest.Mock).mockResolvedValue(profile);
    const req = {
      headers: new Headers({ "x-csrf-token": "token" }),
      json: async () => body,
    } as any;
    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, profile });
  });
});

