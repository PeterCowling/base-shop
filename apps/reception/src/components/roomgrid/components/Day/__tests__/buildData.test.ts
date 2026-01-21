import "@testing-library/jest-dom";
import { buildDays } from "../utils/buildData";

describe("buildDays", () => {
  it("produces inclusive day range with weekend and today flags", () => {
    jest.setSystemTime(new Date("2025-05-02T00:00:00Z"));

    const days = buildDays("2025-05-01", "2025-05-03", "en-US");

    expect(days).toEqual([
      { date: "2025-05-01", label: "01/05/2025", weekend: false, today: false },
      { date: "2025-05-02", label: "02/05/2025", weekend: false, today: true },
      { date: "2025-05-03", label: "03/05/2025", weekend: true, today: false },
    ]);

    jest.useRealTimers();
  });
});
