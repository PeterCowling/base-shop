
import "@testing-library/jest-dom";
import formatDisplayDate from "@/utils/formatDisplayDate";

describe("formatDisplayDate", () => {
  it("formats dates using medium style for en", () => {
    const date = new Date("2025-05-29T00:00:00Z");
    expect(formatDisplayDate("en", date)).toBe(
      new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date),
    );
  });

  it("formats dates using medium style for fr", () => {
    const date = new Date("2025-10-31T00:00:00Z");
    expect(formatDisplayDate("fr", date)).toBe(
      new Intl.DateTimeFormat("fr", { dateStyle: "medium" }).format(date),
    );
  });
});