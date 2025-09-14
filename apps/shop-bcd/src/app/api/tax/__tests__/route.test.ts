/** @jest-environment node */

jest.mock("@acme/zod-utils/initZod", () => ({}));
jest.mock("@platform-core/tax", () => ({ calculateTax: jest.fn() }));

import { NextRequest } from "next/server";
import { POST } from "../route";
import { calculateTax } from "@platform-core/tax";

describe("POST /api/tax", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("returns tax on success", async () => {
    (calculateTax as jest.Mock).mockResolvedValue(123);
    const req = new NextRequest("http://localhost/api/tax", {
      method: "POST",
      body: JSON.stringify({ provider: "taxjar", amount: 10, toCountry: "US" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ tax: 123 });
  });

  it("returns 400 for invalid body", async () => {
    const req = new NextRequest("http://localhost/api/tax", {
      method: "POST",
      body: JSON.stringify({ provider: "taxjar" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 500 when calculation fails", async () => {
    (calculateTax as jest.Mock).mockRejectedValue(new Error("fail"));
    const req = new NextRequest("http://localhost/api/tax", {
      method: "POST",
      body: JSON.stringify({ provider: "taxjar", amount: 10, toCountry: "US" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "fail" });
  });
});
