
import "@testing-library/jest-dom";
import { ccReceiptConfirmationSchema } from "../ccReceiptConfirmationSchema";

describe("ccReceiptConfirmationSchema", () => {
  it("accepts valid confirmation objects", () => {
    const result = ccReceiptConfirmationSchema.safeParse({
      user: "alice",
      timestamp: "2024-01-01T10:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects objects with missing fields", () => {
    expect(ccReceiptConfirmationSchema.safeParse({ user: "x" }).success).toBe(
      false
    );
    expect(
      ccReceiptConfirmationSchema.safeParse({ timestamp: "t" }).success
    ).toBe(false);
  });
});
