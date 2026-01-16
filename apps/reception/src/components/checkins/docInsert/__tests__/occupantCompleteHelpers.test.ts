import { describe, expect, it } from "vitest";
import type { OccupantDetails } from "../../../../types/hooks/data/guestDetailsData";
import {
  occupantIsComplete,
  occupantRequiredSchema,
} from "../occupantCompleteHelpers";

const baseOccupant = {
  firstName: "John",
  lastName: "Doe",
  gender: "M",
  placeOfBirth: "City",
  citizenship: "Country",
  municipality: "Town",
  document: { number: "123", type: "passport" },
  dateOfBirth: { yyyy: "1990", mm: "01", dd: "01" },
};

describe("occupantIsComplete", () => {
  it("returns true for a valid occupant", () => {
    expect(occupantIsComplete(baseOccupant)).toBe(true);
  });

  it("returns false when required fields are missing", () => {
    const incomplete: OccupantDetails = {
      ...baseOccupant,
      document: { number: "123" },
    };
    expect(occupantIsComplete(incomplete)).toBe(false);
  });

  it("schema fails when DOB missing", () => {
    const result = occupantRequiredSchema.safeParse({
      ...baseOccupant,
      dateOfBirth: { yyyy: "", mm: "", dd: "" },
    });
    expect(result.success).toBe(false);
  });
});
