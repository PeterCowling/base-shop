import { describe, expect, it } from "vitest";

import { firebaseBookingSchema } from "../bookingsSchema";

describe("firebaseBookingSchema", () => {
  it("parses a booking with occupants and optional __notes", () => {
    const result = firebaseBookingSchema.safeParse({
      occupant1: {
        checkInDate: "2023-04-01",
        leadGuest: true,
      },
      occupant2: {
        checkInDate: "2023-04-01",
      },
      __notes: {
        note1: {
          text: "arrives late",
          timestamp: "2023-03-31T20:00:00Z",
          user: "admin",
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects properties that are not booking occupants", () => {
    const result = firebaseBookingSchema.safeParse({
      occupant1: {
        checkInDate: "2023-04-01",
      },
      invalid: {
        foo: "bar",
      },
    });
    expect(result.success).toBe(false);
  });
});
