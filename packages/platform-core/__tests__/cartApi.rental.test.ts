import { buildRequest, mockCartCookie, mockCartStore } from "./cartApi.test.utils";

describe("cart API POST rental branch", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("passes rental when provided", async () => {
    const sku = { id: "rent1", stock: 5, sizes: [] } as const;
    const updated = { [sku.id]: { sku, qty: 1, rental: { start: "s", end: "e" } } } as any;
    const inc = jest.fn(async () => updated);
    mockCartCookie();
    jest.doMock("../src/products", () => ({
      __esModule: true,
      getProductById: () => sku,
      PRODUCTS: [sku],
    }));
    mockCartStore({
      createCart: jest.fn(async () => "c1"),
      getCart: jest.fn(async () => ({})),
      incrementQty: inc,
    });

    const { POST } = await import("../src/cartApi");
    const rental = { start: "2024-01-01", end: "2024-01-03", durationUnit: "day", termsVersion: "v1" } as any;
    const res = await POST(buildRequest({ sku: { id: sku.id }, qty: 1, rental }));
    expect(inc).toHaveBeenCalledWith("c1", sku, 1, undefined, {
      ...rental,
      sku: sku.id,
    });
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.cart).toEqual(updated);
  });
});
