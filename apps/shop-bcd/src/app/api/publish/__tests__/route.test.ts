/** @jest-environment node */

jest.mock("@auth", () => ({ requirePermission: jest.fn() }));
jest.mock("../../../../../../scripts/src/republish-shop", () => ({
  republishShop: jest.fn(),
}), { virtual: true });

import { POST } from "../route";
import { requirePermission } from "@auth";

describe("POST /api/publish", () => {
  it("returns 401 when unauthorized", async () => {
    (requirePermission as jest.Mock).mockRejectedValue(new Error("no"));
    const res = await POST();
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });
});
