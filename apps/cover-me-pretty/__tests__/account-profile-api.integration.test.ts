/** @jest-environment node */

jest.mock("@acme/zod-utils/initZod", () => ({}));
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
}));

import { getCustomerSession } from "@auth";
import { NextRequest } from "next/server";
import { GET, PUT } from "../src/app/api/account/profile/route";
import { updateCustomerProfile } from "@platform-core/customerProfiles";

describe("/api/account/profile integration", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns 404 when profile is missing", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "cust-404" });
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns 409 when email is duplicate", async () => {
    await updateCustomerProfile("cust-1", { name: "Jane", email: "jane@example.com" });
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "cust-2" });
    const req = new NextRequest("http://localhost/api/account/profile", {
      method: "PUT",
      body: JSON.stringify({ name: "John", email: "jane@example.com" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PUT(req);
    expect(res.status).toBe(409);
  });
});
