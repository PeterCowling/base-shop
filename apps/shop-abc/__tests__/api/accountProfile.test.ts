// apps/shop-abc/__tests__/api/accountProfile.test.ts
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
}));

jest.mock("@platform-core/customers", () => ({
  __esModule: true,
  updateCustomerProfile: jest.fn(),
}));

import { getCustomerSession } from "@auth";
import { updateCustomerProfile } from "@platform-core/customers";

if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

function createRequest(body: any): any {
  return { json: async () => body } as any;
}

afterEach(() => {
  jest.resetAllMocks();
});

describe("/api/account/profile", () => {
  it("returns 401 for unauthorized requests", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue(null);
    const { PUT } = await import("../../src/app/api/account/profile/route");
    const res = await PUT(createRequest({ name: "A", email: "a@b.com" }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 400 with validation errors for invalid payload", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
      role: "user",
    });
    const { PUT } = await import("../../src/app/api/account/profile/route");
    const res = await PUT(createRequest({ name: "", email: "bad" }));
    expect(res.status).toBe(400);
    const errors = await res.json();
    expect(errors).toHaveProperty("name");
    expect(errors).toHaveProperty("email");
    expect(updateCustomerProfile).not.toHaveBeenCalled();
  });

  it("persists profile changes for valid payload", async () => {
    const session = { customerId: "cust1", role: "user" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    const { PUT } = await import("../../src/app/api/account/profile/route");
    const profile = { name: "Jane", email: "jane@example.com" };
    const res = await PUT(createRequest(profile));
    expect(updateCustomerProfile).toHaveBeenCalledWith(
      session.customerId,
      profile
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, profile });
  });
});

