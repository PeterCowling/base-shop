import { describe, expect, it } from "vitest";

import { parseGuestsDetails } from "../useGuestDetails";

const raw = {
  BR1: {
    occ1: {
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: { yyyy: "", mm: "", dd: "" },
    },
  },
};

describe("parseGuestsDetails", () => {
  it("uses loose schema for unchecked guests", () => {
    const { data, invalidCount } = parseGuestsDetails(raw, () => false);
    expect(invalidCount).toBe(0);
    expect(data.BR1).toBeDefined();
  });

  it("uses strict schema for checked in guests", () => {
    const { invalidCount } = parseGuestsDetails(raw, () => true);
    expect(invalidCount).toBe(1);
  });
});
