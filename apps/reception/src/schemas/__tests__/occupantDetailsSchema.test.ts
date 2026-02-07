
import "@testing-library/jest-dom";

import { occupantDetailsSchema } from "../occupantDetailsSchema";

describe("occupantDetailsSchema", () => {
  it("passes for a valid occupant", () => {
    const result = occupantDetailsSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      allocated: "10",
      dateOfBirth: { yyyy: "1990", mm: "05", dd: "15" },
    });
    expect(result.success).toBe(true);
  });

  it("fails for invalid month", () => {
    const result = occupantDetailsSchema.safeParse({
      dateOfBirth: { yyyy: "1990", mm: "13", dd: "15" },
    });
    expect(result.success).toBe(false);
  });

  it("fails for impossible dates", () => {
    const result = occupantDetailsSchema.safeParse({
      dateOfBirth: { yyyy: "1990", mm: "02", dd: "30" },
    });
    expect(result.success).toBe(false);
  });

  it("permits any age", () => {
    const young = occupantDetailsSchema.safeParse({
      allocated: "8",
      dateOfBirth: { yyyy: "2008", mm: "05", dd: "01" },
    });
    const old = occupantDetailsSchema.safeParse({
      allocated: "7",
      dateOfBirth: { yyyy: "1940", mm: "05", dd: "01" },
    });
    expect(young.success).toBe(true);
    expect(old.success).toBe(true);
  });

  it("accepts single-digit day and month", () => {
    const result = occupantDetailsSchema.safeParse({
      dateOfBirth: { yyyy: "1990", mm: "5", dd: "7" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts numeric values for date fields", () => {
    const result = occupantDetailsSchema.safeParse({
      dateOfBirth: { yyyy: 1990, mm: 5, dd: 7 },
    });
    expect(result.success).toBe(true);
  });

  it("allows empty date fields", () => {
    const result = occupantDetailsSchema.safeParse({
      dateOfBirth: { yyyy: "", mm: "", dd: "" },
    });
    expect(result.success).toBe(true);
  });
});
