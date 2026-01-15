import { describe, expect, it } from "vitest";
import type { EmailProgressData } from "../emailProgressDataSchema";
import { EmailProgressDataSchema } from "../emailProgressDataSchema";

describe("EmailProgressDataSchema", () => {
  const validData: EmailProgressData = {
    occupantId: "occ1",
    bookingRef: "BR1",
    occupantName: "Alice",
    occupantEmail: "alice@example.com",
    currentCode: 1,
    hoursElapsed: 12,
  };

  it("accepts valid data", () => {
    const result = EmailProgressDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  const requiredFields: Array<keyof EmailProgressData> = [
    "occupantId",
    "bookingRef",
    "occupantName",
    "occupantEmail",
    "currentCode",
  ];

  requiredFields.forEach((field) => {
    it(`requires ${field}`, () => {
      const partial: Partial<EmailProgressData> = { ...validData };
      delete partial[field];
      const result = EmailProgressDataSchema.safeParse(partial);
      expect(result.success).toBe(false);
    });

    it(`rejects incorrect type for ${field}`, () => {
      const invalid = {
        ...validData,
        [field]: field === "currentCode" ? "1" : 1,
      };
      const result = EmailProgressDataSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  it("allows hoursElapsed to be null", () => {
    const result = EmailProgressDataSchema.safeParse({
      ...validData,
      hoursElapsed: null,
    });
    expect(result.success).toBe(true);
  });
});
