
import "@testing-library/jest-dom";

import { roomsByDateSchema } from "../roomsByDateSchema";

describe("roomsByDateSchema", () => {
  it("parses a nested dates to rooms to bookings object", () => {
    const data = {
      "2024-08-01": {
        "101": {
          b1: {
            guestIds: ["g1", "g2"],
          },
        },
        "102": {
          b2: {
            guestIds: [],
          },
        },
      },
      "2024-08-02": {
        "101": {
          b3: {
            guestIds: ["g3"],
          },
        },
      },
    };

    const result = roomsByDateSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("parses rooms represented as arrays", () => {
    const data = {
      "2024-09-01": {
        "101": [
          {
            guestIds: ["g1"],
          },
        ],
      },
    };

    const result = roomsByDateSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects objects missing a room level", () => {
    const bad = {
      "2024-08-01": {
        b1: { guestIds: ["g1"] },
      },
    };
    const result = roomsByDateSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects guestIds that are not strings", () => {
    const bad = {
      "2024-08-01": {
        "101": {
          b1: { guestIds: ["g1", 2] },
        },
      },
    };
    const result = roomsByDateSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});
