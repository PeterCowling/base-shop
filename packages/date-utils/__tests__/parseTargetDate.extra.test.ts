import { parseTargetDate } from "../src";

describe("parseTargetDate additional coverage", () => {
  it("parses ISO string with timezone", () => {
    expect(parseTargetDate("2025-06-01T23:59:59Z")?.toISOString()).toBe(
      "2025-06-01T23:59:59.000Z"
    );
  });

  describe("when TZ env is unset", () => {
    const original = process.env.TZ;
    beforeEach(() => {
      delete process.env.TZ;
    });
    afterEach(() => {
      process.env.TZ = original;
    });

    it("parses local date", () => {
      const d = parseTargetDate("2025-01-05");
      expect(d?.toISOString()).toBe(new Date(2025, 0, 5).toISOString());
    });

    it("rejects invalid local date", () => {
      expect(parseTargetDate("2025-02-30")).toBeNull();
    });
  });
});
