import { format,parseISO } from "../src";

describe("parseISO", () => {
  test("parses valid YYYY-MM-DD string", () => {
    const d = parseISO("2025-01-02");
    expect(d).toBeInstanceOf(Date);
    expect(format(d, "yyyy-MM-dd")).toBe("2025-01-02");
  });

  test("returns Invalid Date for invalid input", () => {
    expect(Number.isNaN(parseISO("2025-99-99").getTime())).toBe(true);
  });
});

