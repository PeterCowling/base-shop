import { describe, expect, it } from "vitest";
import type { GuestByBookingRecord } from "../guestsByBookingSchema";
import { guestsByBookingSchema } from "../guestsByBookingSchema";

describe("guestsByBookingSchema", () => {
  it("accepts objects with reservation codes", () => {
    const result = guestsByBookingSchema.safeParse({
      booking1: { reservationCode: "AAA" },
      booking2: { reservationCode: "BBB" },
    });
    expect(result.success).toBe(true);
  });

  it("requires reservationCode for each entry", () => {
    const result = guestsByBookingSchema.safeParse({
      booking1: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid data types", () => {
    const result1 = guestsByBookingSchema.safeParse({
      booking1: { reservationCode: 123 as unknown as string },
    });
    const result2 = guestsByBookingSchema.safeParse({
      booking1: "invalid" as unknown as GuestByBookingRecord,
    });
    expect(result1.success).toBe(false);
    expect(result2.success).toBe(false);
  });
});
