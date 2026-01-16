import { jest } from "@jest/globals";
import { asNextJson } from "@acme/test-utils";

process.env.INVENTORY_AUTHORITY_TOKEN = "test-token";

jest.mock("@platform-core/inventoryValidation", () => ({
  validateInventoryAvailability: jest.fn(),
}));

import { validateInventoryAvailability } from "@platform-core/inventoryValidation";

const makeReq = (
  body: unknown,
  headers: Record<string, string> = {},
) =>
  asNextJson(body, {
    url: "http://store.example/api/inventory/validate",
    headers: {
      "x-request-id": "test-request-id",
      ...headers,
    },
  });

describe("/api/inventory/validate POST", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("returns 400 when missing shop context", async () => {
    const { POST } = await import("../src/api/inventory/validate/route");
    const res = await POST(
      makeReq(
        { items: [{ sku: "s1", quantity: 1 }] },
        { authorization: "Bearer test-token" },
      ) as any,
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Missing shop context" });
    expect(res.headers.get("x-request-id")).toBe("test-request-id");
  });

  test("returns 401 when unauthorized", async () => {
    const { POST } = await import("../src/api/inventory/validate/route");
    const res = await POST(
      makeReq(
        { items: [{ sku: "s1", quantity: 1 }] },
        { "x-shop-id": "shop" },
      ) as any,
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(res.headers.get("x-request-id")).toBe("test-request-id");
  });

  test("returns 400 when request body invalid", async () => {
    const { POST } = await import("../src/api/inventory/validate/route");
    const res = await POST(
      makeReq(
        {},
        { "x-shop-id": "shop", authorization: "Bearer test-token" },
      ) as any,
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid request" });
    expect(res.headers.get("x-request-id")).toBe("test-request-id");
  });

  test("returns 409 with insufficient items payload", async () => {
    (validateInventoryAvailability as jest.Mock).mockResolvedValueOnce({
      ok: false,
      insufficient: [
        {
          sku: "s1",
          variantAttributes: { size: "M" },
          variantKey: "s1#size:M",
          requested: 2,
          available: 1,
        },
      ],
    });

    const { POST } = await import("../src/api/inventory/validate/route");
    const res = await POST(
      makeReq(
        { items: [{ sku: "s1", quantity: 2, variantAttributes: { size: "M" } }] },
        { "x-shop-id": "shop", authorization: "Bearer test-token" },
      ) as any,
    );
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "Insufficient stock",
      code: "inventory_insufficient",
      reason: "inventory_insufficient",
      shopId: "shop",
      items: [
        {
          sku: "s1",
          variantAttributes: { size: "M" },
          variantKey: "s1#size:M",
          requested: 2,
          available: 1,
        },
      ],
      retryAfterMs: null,
    });
    expect(res.headers.get("x-request-id")).toBe("test-request-id");
  });

  test("returns 200 when inventory ok", async () => {
    (validateInventoryAvailability as jest.Mock).mockResolvedValueOnce({ ok: true });

    const { POST } = await import("../src/api/inventory/validate/route");
    const res = await POST(
      makeReq(
        { items: [{ sku: "s1", quantity: 1 }] },
        { "x-shop-id": "shop", authorization: "Bearer test-token" },
      ) as any,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get("x-request-id")).toBe("test-request-id");
  });
});
