import { describe, expect, it } from "vitest";

import {
  depositTypeEnum,
  loanItemEnum,
  loanTransactionSchema,
  txTypeEnum,
} from "../loansSchema";

describe("loan enums", () => {
  it("accepts valid enum values", () => {
    const loanItems = [
      "Umbrella",
      "Hairdryer",
      "Steamer",
      "Padlock",
      "Keycard",
      "No_card",
    ];
    loanItems.forEach((val) =>
      expect(() => loanItemEnum.parse(val)).not.toThrow()
    );

    const depositTypes = ["CASH", "PASSPORT", "LICENSE", "ID", "NO_CARD"];
    depositTypes.forEach((val) =>
      expect(() => depositTypeEnum.parse(val)).not.toThrow()
    );

    const txTypes = ["Loan", "Refund", "No_Card"];
    txTypes.forEach((val) => expect(() => txTypeEnum.parse(val)).not.toThrow());
  });

  it("rejects invalid enum strings", () => {
    expect(() => loanItemEnum.parse("Foo")).toThrow();
    expect(() => depositTypeEnum.parse("Bar")).toThrow();
    expect(() => txTypeEnum.parse("Baz")).toThrow();
  });
});

describe("loanTransactionSchema", () => {
  it("accepts valid transaction data", () => {
    expect(() =>
      loanTransactionSchema.parse({
        count: 1,
        createdAt: "2024-01-01",
        depositType: "CASH",
        deposit: 10,
        item: "Umbrella",
        type: "Loan",
      })
    ).not.toThrow();
  });

  it("rejects malformed transaction data", () => {
    expect(() =>
      loanTransactionSchema.parse({
        count: 1,
        createdAt: "2024-01-01",
        depositType: "DOG",
        deposit: 10,
        item: "Umbrella",
        type: "Loan",
      })
    ).toThrow();

    expect(() =>
      loanTransactionSchema.parse({
        count: 1,
        createdAt: "2024-01-01",
        depositType: "CASH",
        deposit: 10,
        item: "Ball",
        type: "Loan",
      })
    ).toThrow();

    expect(() =>
      loanTransactionSchema.parse({
        count: 1,
        createdAt: "2024-01-01",
        depositType: "CASH",
        deposit: "10",
        item: "Umbrella",
        type: "Loan",
      })
    ).toThrow();
  });
});
