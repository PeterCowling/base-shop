import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";
import type { OccupantDetails } from "../../types/hooks/data/guestDetailsData";
import { useConstructAlloggiatiRecord } from "../constructAlloggiatiRecord";

jest.mock("../useComuneCodes", () => ({
  useComuneCodes: () => ({
    getComuneInfo: jest.fn().mockReturnValue(["500123456", "RM"]),
  }),
}));

describe("constructAlloggiatiRecord", () => {
  it("builds a fixed length record string", () => {
    jest.useFakeTimers();
    // Freeze time so the "yesterday" logic is predictable
    jest.setSystemTime(new Date("2024-02-20T08:00:00Z"));

    const { result } = renderHook(() => useConstructAlloggiatiRecord());

    const occupant: OccupantDetails = {
      firstName: "Mario",
      lastName: "Rossi",
      gender: "M",
      dateOfBirth: { dd: "01", mm: "12", yyyy: "1980" },
      placeOfBirth: "Italy",
      municipality: "Rome",
      citizenship: "Italy",
      document: { type: "passport", number: "AA1111111" },
    };

    const record = result.current.constructAlloggiatiRecord(occupant);

    function safePad(value: string, length: number) {
      const trimmed = value.substring(0, length);
      return trimmed.padEnd(length, " ");
    }

    const expected = [
      safePad("16", 2),
      safePad("19/02/2024", 10),
      safePad("1", 2),
      safePad("Rossi", 50),
      safePad("Mario", 30),
      "1",
      safePad("01/12/1980", 10),
      safePad("500123456", 9),
      safePad("RM", 2),
      safePad("100000100", 9),
      safePad("100000100", 9),
      safePad("PASOR", 5),
      safePad("AA1111111", 20),
      safePad("100000100", 9),
    ].join("");

    expect(record.length).toBe(168);
    expect(record).toBe(expected);

    jest.useRealTimers();
  });
});
