import { jest } from "@jest/globals";

process.env.INVENTORY_AUTHORITY_TOKEN = "token";

afterEach(() => jest.resetModules());

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://example.com/api/inventory/validate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer token",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("/api/inventory/validate (cms)", () => {
  test("accepts canonical body with shopId and variantAttributes", async () => {
    const validateInventoryAvailability = jest.fn(async () => ({ ok: true }));
    jest.doMock(
      "@acme/platform-core/inventoryValidation",
      () => ({ __esModule: true, validateInventoryAvailability }),
      { virtual: true },
    );

    const { POST } = await import("../src/app/api/inventory/validate/route");
    const res = await POST(
      makeRequest({
        shopId: "shop1",
        items: [{ sku: "sku1", quantity: 1, variantAttributes: { size: "adult" } }],
      }) as any,
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(validateInventoryAvailability).toHaveBeenCalledWith("shop1", [
      { sku: "sku1", quantity: 1, variantAttributes: { size: "adult" } },
    ]);
  });

  test("returns 400 when x-shop-id and shopId mismatch", async () => {
    const validateInventoryAvailability = jest.fn(async () => ({ ok: true }));
    jest.doMock(
      "@acme/platform-core/inventoryValidation",
      () => ({ __esModule: true, validateInventoryAvailability }),
      { virtual: true },
    );

    const { POST } = await import("../src/app/api/inventory/validate/route");
    const res = await POST(
      makeRequest(
        {
          shopId: "shop1",
          items: [{ sku: "sku1", quantity: 1 }],
        },
        { "x-shop-id": "shop2" },
      ) as any,
    );

    expect(res.status).toBe(400);
    expect(validateInventoryAvailability).not.toHaveBeenCalled();
  });
});

