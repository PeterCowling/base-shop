
import "@testing-library/jest-dom";

import { salesOrderSchema } from "../salesOrderSchema";

describe("salesOrderSchema", () => {
  it("parses an order with valid items", () => {
    expect(() =>
      salesOrderSchema.parse({
        orderKey: "order1",
        confirmed: true,
        bleepNumber: "10",
        userName: "Alice",
        time: "2024-01-01T10:00:00Z",
        paymentMethod: "cash",
        items: [
          { product: "coffee", count: 2, price: 3, lineType: "bds" },
          { product: "sandwich", count: 1, lineType: "kds" },
        ],
      })
    ).not.toThrow();
  });

  it("rejects items with invalid line types", () => {
    expect(() =>
      salesOrderSchema.parse({
        orderKey: "badOrder",
        confirmed: true,
        bleepNumber: "5",
        userName: "Bob",
        time: "2024-01-01T11:00:00Z",
        paymentMethod: "card",
        items: [{ product: "water", count: 1, lineType: "invalid" }],
      })
    ).toThrow();
  });

  it("rejects when required fields are missing", () => {
    expect(() =>
      salesOrderSchema.parse({
        confirmed: true,
        bleepNumber: "5",
        userName: "Bob",
        time: "2024-01-01T11:00:00Z",
        paymentMethod: "card",
        items: [{ product: "water", count: 1 }],
      })
    ).toThrow();
  });
});
