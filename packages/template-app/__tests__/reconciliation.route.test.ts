// packages/template-app/__tests__/reconciliation.route.test.ts

jest.mock("next/server", () => {
  class NextResponse extends Response {
    static json(data: any, init?: ResponseInit) {
      const headers = new Headers(init?.headers);
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
      return new Response(JSON.stringify(data), { ...init, headers });
    }
  }

  return {
    NextResponse,
    NextRequest: class NextRequest {},
  };
});

const importExternalOrder = jest.fn();
jest.mock("@platform-core/orders/externalImport", () => ({ importExternalOrder }));

const recordReconciliationIngest = jest.fn();
jest.mock("@platform-core/reconciliationIngest", () => ({ recordReconciliationIngest }));

import { asNextJson } from "@acme/test-utils";
import { POST } from "../src/api/reconciliation/route";

describe("/api/reconciliation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.RECONCILIATION_AUTH_TOKEN;
  });

  test("returns 401 when token is set and auth is missing", async () => {
    process.env.RECONCILIATION_AUTH_TOKEN = "secret";
    const req = asNextJson(
      { id: "cs_1", currency: "USD", amountTotal: 1234 },
      { headers: { "x-shop-id": "shop" } },
    );
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  test("returns 400 when x-shop-id is missing", async () => {
    const req = asNextJson({ id: "cs_1", currency: "USD", amountTotal: 1234 });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  test("returns 400 when payload shop mismatches x-shop-id", async () => {
    const req = asNextJson(
      { shop: "other", id: "cs_1", currency: "USD", amountTotal: 1234 },
      { headers: { "x-shop-id": "shop" } },
    );
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toMatch(/mismatch/i);
  });

  test("normalizes float major units into minor units", async () => {
    importExternalOrder.mockResolvedValueOnce({ id: "ord_1" });
    const req = asNextJson(
      { id: "cs_1", currency: "usd", amountTotal: 12.34 },
      { headers: { "x-shop-id": "shop", "x-request-id": "req_1" } },
    );
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ orderId: "ord_1" });

    expect(recordReconciliationIngest).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: "shop",
        sessionId: "cs_1",
        source: "worker_reconciliation",
        requestId: "req_1",
        currency: "USD",
        amountTotalMinor: 1234,
        normalizationApplied: true,
      }),
    );

    expect(importExternalOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        shop: "shop",
        sessionId: "cs_1",
        currency: "USD",
        amountTotal: 1234,
      }),
    );
  });

  test("treats integer amountTotal as minor units without normalization", async () => {
    importExternalOrder.mockResolvedValueOnce({ id: "ord_1" });
    const req = asNextJson(
      { id: "cs_1", currency: "USD", amountTotal: 1234 },
      { headers: { "x-shop-id": "shop" } },
    );
    const res = await POST(req as any);
    expect(res.status).toBe(200);

    expect(recordReconciliationIngest).toHaveBeenCalledWith(
      expect.objectContaining({
        amountTotalMinor: 1234,
        normalizationApplied: false,
      }),
    );
  });
});

