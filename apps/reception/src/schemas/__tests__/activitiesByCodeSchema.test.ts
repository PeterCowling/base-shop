
import "@testing-library/jest-dom";

import { activitiesByCodeForOccupantSchema } from "../activitiesByCodeSchema";

describe("activitiesByCodeForOccupantSchema", () => {
  it("parses valid nested records", () => {
    const input = {
      occ1: {
        act1: { who: "Alice", timestamp: "2024-01-01T00:00:00Z" },
        act2: { who: "Bob" },
      },
      occ2: {
        act3: { who: "Carol", timestamp: "2024-01-02T00:00:00Z" },
      },
    };

    const result = activitiesByCodeForOccupantSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects when 'who' is missing", () => {
    const input = {
      occ1: {
        act1: { timestamp: "2024-01-01T00:00:00Z" },
      },
    };

    const result = activitiesByCodeForOccupantSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid data types", () => {
    const input = {
      occ1: {
        act1: { who: 123, timestamp: 42 },
      },
    } as unknown;

    const result = activitiesByCodeForOccupantSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
