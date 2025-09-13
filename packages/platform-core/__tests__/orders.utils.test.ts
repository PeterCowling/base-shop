import { normalize, Order } from "../src/orders/utils";

describe("normalize", () => {
  it("returns null when given null", () => {
    expect(normalize(null)).toBeNull();
  });

  it("replaces null properties with undefined", () => {
    const order = {
      id: "order1",
      sessionId: "sess1",
      shop: "shop1",
      deposit: 0,
      startedAt: "2023-01-01",
      customerId: null,
    } as unknown as Order;

    const normalized = normalize(order);
    expect(normalized?.customerId).toBeUndefined();
  });

  it("leaves non-null properties unchanged", () => {
    const order = {
      id: "order1",
      sessionId: "sess1",
      shop: "shop1",
      deposit: 0,
      startedAt: "2023-01-01",
    } as unknown as Order;

    const normalized = normalize(order);
    expect(normalized).toEqual(order);
  });
});
