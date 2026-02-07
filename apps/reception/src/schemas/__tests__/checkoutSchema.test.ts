
import "@testing-library/jest-dom";

import { checkoutsSchema } from "../checkoutSchema";

describe("checkoutsSchema", () => {
  it("accepts records without notes", () => {
    const result = checkoutsSchema.safeParse({
      "2024-06-01": {
        occ1: { reservationCode: "R1", timestamp: "t" },
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts records with optional __notes", () => {
    const result = checkoutsSchema.safeParse({
      "2024-06-01": {
        occ1: {
          reservationCode: "R1",
          timestamp: "t",
          __notes: { n1: { text: "hi", timestamp: "t", user: "u" } },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("fails with invalid notes", () => {
    const result = checkoutsSchema.safeParse({
      "2024-06-01": {
        occ1: { timestamp: "t", __notes: { n1: { text: 5 } } },
      },
    });
    expect(result.success).toBe(false);
  });

  it("fails when record shape is wrong", () => {
    const result = checkoutsSchema.safeParse({
      "2024-06-01": {
        occ1: 123,
      },
    });
    expect(result.success).toBe(false);
  });
});
