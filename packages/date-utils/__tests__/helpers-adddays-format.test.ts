import { addDays, format,parseISO } from "../src";

describe("exported helpers", () => {
  test("addDays and format combine", () => {
    const d = addDays(parseISO("2025-01-01"), 1);
    expect(format(d, "yyyy-MM-dd")).toBe("2025-01-02");
  });
});

