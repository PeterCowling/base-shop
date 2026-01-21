
import "@testing-library/jest-dom";
import { formatEnGbDateTime } from "../dateUtils";

process.env.TZ = "UTC";

describe("formatEnGbDateTime", () => {
  it("formats date in Rome timezone with seconds", () => {
    const date = new Date("2024-06-16T21:15:00Z");
    expect(formatEnGbDateTime(date)).toBe("16/06/2024, 23:15:00");
  });

  it("honours custom formatting options", () => {
    const date = new Date("2024-06-16T21:15:00Z");
    expect(
      formatEnGbDateTime(date, { dateStyle: "short", timeStyle: "short" })
    ).toBe("16/06/2024, 23:15");
  });
});
