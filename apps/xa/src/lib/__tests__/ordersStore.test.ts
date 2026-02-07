import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import {
  createOrder,
  findOrderByNumber,
  findOrdersByNumberAndEmail,
  orderTotal,
  readOrders,
  writeOrders,
  type XaOrder,
} from "../ordersStore";

const ORDERS_KEY = "XA_ORDERS_V1";
const ORIGINAL_CRYPTO = globalThis.crypto;

beforeEach(() => {
  window.localStorage.clear();
  Object.defineProperty(globalThis, "crypto", {
    value: { randomUUID: () => "order-id-123" },
    configurable: true,
  });
});

afterEach(() => {
  window.localStorage.clear();
  Object.defineProperty(globalThis, "crypto", {
    value: ORIGINAL_CRYPTO,
    configurable: true,
  });
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("ordersStore", () => {
  it("returns empty list when storage is invalid", () => {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify({}));
    expect(readOrders()).toEqual([]);
  });

  it("creates and persists new orders", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-01T00:00:00Z"));
    jest.spyOn(Math, "random").mockReturnValue(0.5);

    const order = createOrder({
      email: "buyer@example.com",
      currency: "USD",
      lines: [
        { skuId: "sku-1", title: "Item", qty: 2, unitPrice: 150 },
      ],
    });

    expect(order.id).toBe("order-id-123");
    expect(order.number).toBe("5500000");
    expect(order.status).toBe("Processing");
    expect(order.createdAt).toBe("2025-01-01T00:00:00.000Z");
    expect(readOrders()).toHaveLength(1);
  });

  it("finds orders by number and email", () => {
    const orders: XaOrder[] = [
      {
        id: "1",
        number: "1234567",
        email: "Buyer@Example.com",
        currency: "USD",
        status: "Processing",
        createdAt: "2025-01-01T00:00:00Z",
        lines: [{ skuId: "sku-1", title: "Item", qty: 1, unitPrice: 100 }],
      },
    ];
    writeOrders(orders);

    expect(findOrderByNumber("1234567")?.id).toBe("1");
    expect(findOrdersByNumberAndEmail("1234567", "buyer@example.com")).toHaveLength(1);
    expect(findOrdersByNumberAndEmail("1234567", "nope@example.com")).toHaveLength(0);
  });

  it("calculates order totals", () => {
    const order: XaOrder = {
      id: "1",
      number: "1234567",
      email: "buyer@example.com",
      currency: "USD",
      status: "Processing",
      createdAt: "2025-01-01T00:00:00Z",
      lines: [
        { skuId: "sku-1", title: "Item", qty: 2, unitPrice: 150 },
        { skuId: "sku-2", title: "Item 2", qty: 1, unitPrice: 200 },
      ],
    };
    expect(orderTotal(order)).toBe(500);
  });
});
