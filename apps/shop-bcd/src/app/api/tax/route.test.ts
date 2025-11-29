/** @jest-environment node */
import { NextResponse, type NextRequest } from "next/server";
import { POST } from "./route";

jest.mock("@shared-utils", () => ({ parseJsonBody: jest.fn() }));
const parseJsonBody = jest.requireMock("@shared-utils")
  .parseJsonBody as jest.Mock;

jest.mock("@platform-core/tax", () => ({ calculateTax: jest.fn() }));
const calculateTax = jest.requireMock("@platform-core/tax")
  .calculateTax as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/tax", () => {
  it("returns validation response when parse fails", async () => {
    const resp = NextResponse.json({ error: "bad" }, { status: 400 });
    parseJsonBody.mockResolvedValue({ success: false, response: resp });
    const res = await POST({} as NextRequest);
    expect(res).toBe(resp);
  });

  it("calculates tax and returns result", async () => {
    parseJsonBody.mockResolvedValue({
      success: true,
      data: { provider: "taxjar", amount: 100, toCountry: "US" },
    });
    calculateTax.mockResolvedValue(7);
    const res = await POST({} as NextRequest);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ tax: 7 });
  });

  it("returns 500 when calculateTax throws", async () => {
    parseJsonBody.mockResolvedValue({
      success: true,
      data: { provider: "taxjar", amount: 100, toCountry: "US" },
    });
    calculateTax.mockRejectedValue(new Error("fail"));
    const res = await POST({} as NextRequest);
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "fail" });
  });
});
