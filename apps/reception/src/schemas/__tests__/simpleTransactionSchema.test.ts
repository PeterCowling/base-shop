
import "@testing-library/jest-dom";
import { simpleTransactionSchema } from "../simpleTransactionSchema";

describe("simpleTransactionSchema", () => {
  it("parses object with required fields", () => {
    expect(() =>
      simpleTransactionSchema.parse({ item: "pen", deposit: 5, count: 2 })
    ).not.toThrow();
  });

  it("parses object with optional fields", () => {
    expect(() =>
      simpleTransactionSchema.parse({
        item: "pen",
        deposit: 5,
        count: 2,
        method: "cash",
        type: "sale",
      })
    ).not.toThrow();
  });

  it("rejects missing required fields or invalid types", () => {
    expect(() =>
      simpleTransactionSchema.parse({ deposit: 5, count: 2 })
    ).toThrow();
    expect(() =>
      simpleTransactionSchema.parse({ item: "pen", count: 2 })
    ).toThrow();
    expect(() =>
      simpleTransactionSchema.parse({ item: "pen", deposit: 5 })
    ).toThrow();
    expect(() =>
      simpleTransactionSchema.parse({
        item: 1 as unknown as string,
        deposit: 5,
        count: 2,
      })
    ).toThrow();
    expect(() =>
      simpleTransactionSchema.parse({
        item: "pen",
        deposit: "5" as unknown as number,
        count: 2,
      })
    ).toThrow();
    expect(() =>
      simpleTransactionSchema.parse({
        item: "pen",
        deposit: 5,
        count: "2" as unknown as number,
      })
    ).toThrow();
  });
});
