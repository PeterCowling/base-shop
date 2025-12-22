// apps/cover-me-pretty/__tests__/api/tryon.analytics.test.ts

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

import { POST } from "../../src/app/api/analytics/tryon/route";
import { asNextJson } from "@acme/test-utils";

describe("analytics/tryon route", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SHOP_ID = "default";
    process.env.NEXT_PUBLIC_GA4_ID = "G-TEST";
    process.env.GA_API_SECRET = "secret";
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  it("forwards TryOnStarted", async () => {
    const body = { type: "TryOnStarted", productId: "sku-1", mode: "accessory", idempotencyKey: "8a074e68-1234-4abc-9def-aaaaaaaaaaaa" } as const;
    const req = asNextJson(body);
    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("measurement_id=G-TEST"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("validates schema (bad uuid)", async () => {
    const body: { type: "TryOnEnhanced"; productId: string; idempotencyKey: string } = {
      type: "TryOnEnhanced",
      productId: "sku-1",
      idempotencyKey: "not-a-uuid",
    };
    const req = asNextJson(body);
    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(400);
  });
});
