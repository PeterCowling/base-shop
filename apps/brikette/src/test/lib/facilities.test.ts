
import "@testing-library/jest-dom";

import { FACILITIES, type FacilityKey } from "@/lib/facilities";

describe("FACILITIES", () => {
  it("contains only unique keys", () => {
    const unique = new Set(FACILITIES);
    expect(unique.size).toBe(FACILITIES.length);
  });

  it("exposes every item as a valid FacilityKey", () => {
    FACILITIES.forEach((key) => {
      const typed: FacilityKey = key;
      expect(typed).toBe(key);
    });
  });

  it("keeps FacilityKey in sync with the literal array", () => {
    // Type-level check: if FacilityKey drifts from the expected union,
    // TypeScript will error at compile time on these assignments.
    const expected: FacilityKey[] = [
      "privateRoom",
      "mixedDorm",
      "femaleDorm",
      "doubleBed",
      "singleBeds",
      "bathroomEnsuite",
      "bathroomShared",
      "seaView",
      "gardenView",
      "airCon",
      "keycard",
      "linen",
    ];
    expect(new Set(FACILITIES)).toEqual(new Set(expected));
  });
});