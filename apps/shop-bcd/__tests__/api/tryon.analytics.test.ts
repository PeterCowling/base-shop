// apps/shop-bcd/__tests__/api/tryon.analytics.test.ts

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

const m = {
  trackTryOnStarted: jest.fn(),
  trackTryOnPreviewShown: jest.fn(),
  trackTryOnEnhanced: jest.fn(),
  trackTryOnAddToCart: jest.fn(),
  trackTryOnError: jest.fn(),
};
jest.mock("@acme/platform-core/analytics", () => ({ __esModule: true, ...m }));

import { POST } from "../../src/app/api/analytics/tryon/route";
import { asNextJson } from "@acme/test-utils";

describe("analytics/tryon route", () => {
  beforeEach(() => {
    Object.values(m).forEach((fn) => (fn as jest.Mock).mockClear());
    process.env.NEXT_PUBLIC_SHOP_ID = "default";
  });

  it("forwards TryOnStarted", async () => {
    const body = { type: "TryOnStarted", productId: "sku-1", mode: "accessory", idempotencyKey: "8a074e68-1234-4abc-9def-aaaaaaaaaaaa" } as const;
    const req = asNextJson(body);
    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(200);
    expect(m.trackTryOnStarted).toHaveBeenCalledWith("default", { productId: "sku-1", mode: "accessory", idempotencyKey: body.idempotencyKey });
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
