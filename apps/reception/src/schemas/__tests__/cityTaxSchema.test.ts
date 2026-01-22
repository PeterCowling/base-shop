
import "@testing-library/jest-dom";

import { cityTaxDataSchema } from "../cityTaxSchema";

describe("cityTaxDataSchema", () => {
  it("parses nested city tax records", () => {
    const data = {
      bookingA: {
        occupant1: { balance: 10, totalDue: 20, totalPaid: 5 },
        occupant2: { balance: 0, totalDue: 0, totalPaid: 0 },
      },
      bookingB: {
        occupant3: { balance: 3.5, totalDue: 10, totalPaid: 6.5 },
      },
    };
    expect(() => cityTaxDataSchema.parse(data)).not.toThrow();
  });

  it("errors when numeric fields are missing", () => {
    const missing = {
      bookingA: {
        occupant1: { balance: 10, totalDue: 20 },
      },
    } as unknown;
    expect(() => cityTaxDataSchema.parse(missing)).toThrow();
  });

  it("errors when numeric fields are non-numeric", () => {
    const invalid = {
      bookingA: {
        occupant1: { balance: "10", totalDue: 20, totalPaid: 5 },
      },
    } as unknown;
    expect(() => cityTaxDataSchema.parse(invalid)).toThrow();
  });
});
