
import "@testing-library/jest-dom";

import { financialTransactionSchema } from "../financialTransactionSchema";

const validTxn = {
  amount: 100,
  bookingRef: "BR123",
  count: 1,
  description: "Room charge",
  itemCategory: "accommodation",
  method: "card",
  occupantId: "occ-1",
  timestamp: "2024-01-01T00:00:00Z",
  type: "charge",
  user_name: "tester",
};

const requiredFields = [
  "amount",
  "bookingRef",
  "count",
  "description",
  "itemCategory",
  "method",
  "occupantId",
  "timestamp",
  "type",
  "user_name",
] as const;

describe("financialTransactionSchema", () => {
  it("accepts a full transaction", () => {
    const result = financialTransactionSchema.safeParse({
      ...validTxn,
      nonRefundable: true,
      docType: "receipt",
    });
    expect(result.success).toBe(true);
  });

  requiredFields.forEach((field) => {
    it(`rejects when ${field} is missing`, () => {
      const { [field]: _omit, ...partial } = validTxn as Record<
        string,
        unknown
      >;
      const result = financialTransactionSchema.safeParse(partial);
      expect(result.success).toBe(false);
    });
  });
});
