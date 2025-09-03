import { jest } from "@jest/globals";

process.env.STRIPE_SECRET_KEY = "test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "test";
process.env.CART_COOKIE_SECRET = "test";

describe("createCartStore require fallback", () => {
  const originalEval = global.eval;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    // restore global eval after each test
    global.eval = originalEval;
  });

  it("falls back to createMemoryCartStore when require throws", async () => {
    // stub eval('require') to throw
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.eval = () => {
      throw new Error("require not available");
    };

    const { createCartStore } = await import("../../src/cartStore");
    const { MemoryCartStore } = await import("../../src/cartStore/memoryStore");

    const store = createCartStore({ backend: "redis" });

    expect(store).toBeInstanceOf(MemoryCartStore);
  });
});
