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

describe("/api/inventory/validate", () => {
  test("accepts canonical items with variantAttributes (tenant endpoint)", async () => {
    const validateInventoryAvailability = jest.fn(async () => ({ ok: true }));
    jest.doMock(
      "@acme/platform-core/inventoryValidation",
      () => ({ __esModule: true, validateInventoryAvailability }),
      { virtual: true },
    );

    const { POST } = await import("../src/api/inventory/validate/route");
    const res = await POST(
      makeRequest({
        items: [{ sku: "sku1", quantity: 1, variantAttributes: { size: "adult" } }],
      }) as any,
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(validateInventoryAvailability).toHaveBeenCalledWith("cover-me-pretty", [
      { sku: "sku1", quantity: 1, variantAttributes: { size: "adult" } },
    ]);
  });

  test("accepts deprecated variantKey when consistent", async () => {
    const validateInventoryAvailability = jest.fn(async () => ({ ok: true }));
    jest.doMock(
      "@acme/platform-core/inventoryValidation",
      () => ({ __esModule: true, validateInventoryAvailability }),
      { virtual: true },
    );

    const { POST } = await import("../src/api/inventory/validate/route");
    const res = await POST(
      makeRequest({
        items: [{ sku: "sku1", quantity: 1, variantKey: "sku1#size:adult" }],
      }) as any,
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(validateInventoryAvailability).toHaveBeenCalledWith("cover-me-pretty", [
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

    const { POST } = await import("../src/api/inventory/validate/route");
    const res = await POST(
      makeRequest(
        {
          shopId: "cover-me-pretty",
          items: [{ sku: "sku1", quantity: 1 }],
        },
        { "x-shop-id": "other-shop" },
      ) as any,
    );

    expect(res.status).toBe(400);
    expect(validateInventoryAvailability).not.toHaveBeenCalled();
  });

  test("returns 400 when variantKey and variantAttributes mismatch", async () => {
    const validateInventoryAvailability = jest.fn(async () => ({ ok: true }));
    jest.doMock(
      "@acme/platform-core/inventoryValidation",
      () => ({ __esModule: true, validateInventoryAvailability }),
      { virtual: true },
    );

    const { POST } = await import("../src/api/inventory/validate/route");
    const res = await POST(
      makeRequest({
        items: [
          {
            sku: "sku1",
            quantity: 1,
            variantKey: "sku1#size:kids",
            variantAttributes: { size: "adult" },
          },
        ],
      }) as any,
    );

    expect(res.status).toBe(400);
    expect(validateInventoryAvailability).not.toHaveBeenCalled();
  });
});

