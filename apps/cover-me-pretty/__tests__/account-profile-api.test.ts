// apps/cover-me-pretty/__tests__/account-profile-api.test.ts
jest.mock("@acme/zod-utils/initZod", () => ({}));
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
}));

jest.mock("@platform-core/customerProfiles", () => ({
  __esModule: true,
  getCustomerProfile: jest.fn(),
  updateCustomerProfile: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

import { getCustomerSession } from "@auth";
import { getCustomerProfile } from "@platform-core/customerProfiles";
import { GET } from "../src/app/api/account/profile/route";

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
