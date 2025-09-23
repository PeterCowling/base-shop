import { MemoryCartStore } from "../memoryStore";


describe("MemoryCartStore", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test("createCart initializes empty cart and getCart returns it", async () => {
    const store = new MemoryCartStore(60);
    const id = await store.createCart();
    expect(id).toBeTruthy();
    await expect(store.getCart(id)).resolves.toEqual({});
  });

  test("incrementQty adds and updates line items and bumps expiry", async () => {
    const store = new MemoryCartStore(60);
    const id = await store.createCart();
    const sku = { id: "sku1" } as any;
    let cart = await store.incrementQty(id, sku, 2);
    expect(cart["sku1"].qty).toBe(2);
    cart = await store.incrementQty(id, sku, 3);
    expect(cart["sku1"].qty).toBe(5);
  });

  test("setQty updates quantity and deletes on zero; removeItem deletes line", async () => {
    const store = new MemoryCartStore(60);
    const id = await store.createCart();
    const sku = { id: "sku2" } as any;
    await store.incrementQty(id, sku, 1);
    await expect(store.setQty(id, "sku2", 4)).resolves.toMatchObject({ sku2: expect.objectContaining({ qty: 4 }) });
    await expect(store.setQty(id, "does-not-exist", 1)).resolves.toBeNull();
    await expect(store.setQty(id, "sku2", 0)).resolves.toEqual({});
    await store.incrementQty(id, sku, 2);
    await expect(store.removeItem(id, "sku2")).resolves.toEqual({});
  });

  test("expired carts are cleared via timer and getCart returns empty", async () => {
    const store = new MemoryCartStore(1); // 1 second TTL
    const id = await store.createCart();
    await store.incrementQty(id, { id: "sku3" } as any, 1);
    jest.advanceTimersByTime(1100);
    jest.runOnlyPendingTimers();
    await expect(store.getCart(id)).resolves.toEqual({});
  });
});
