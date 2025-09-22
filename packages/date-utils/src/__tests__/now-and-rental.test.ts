import {
  nowIso,
  isoDateInNDays,
  calculateRentalDays,
} from "../index";

describe("nowIso", () => {
  it("returns a valid ISO string", () => {
    const iso = nowIso();
    expect(new Date(iso).toISOString()).toBe(iso);
  });
});

describe("isoDateInNDays", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns ISO date string N days ahead", () => {
    expect(isoDateInNDays(3)).toBe("2025-01-04");
  });
  it("returns ISO date string N days behind", () => {
    expect(isoDateInNDays(-3)).toBe("2024-12-29");
  });
  it("returns today's date when offset is zero", () => {
    expect(isoDateInNDays(0)).toBe("2025-01-01");
  });
});

describe("calculateRentalDays", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("computes positive day difference", () => {
    expect(calculateRentalDays("2025-01-03")).toBe(2);
  });
  it("handles same-day and partial-day returns", () => {
    jest.setSystemTime(new Date("2025-01-01T00:00:00Z"));
    expect(calculateRentalDays("2025-01-01")).toBe(1);
    expect(calculateRentalDays("2025-01-02T12:00:00")).toBe(2);
  });
  it("throws for past return dates", () => {
    expect(() => calculateRentalDays("2024-12-31")).toThrow(
      "returnDate must be in the future",
    );
  });
  it("defaults to 1 when return date missing", () => {
    expect(calculateRentalDays()).toBe(1);
  });
  it("throws on invalid date", () => {
    expect(() => calculateRentalDays("not-a-date")).toThrow("Invalid returnDate");
  });
  it("throws on impossible calendar dates", () => {
    expect(() => calculateRentalDays("2025-02-30")).toThrow("Invalid returnDate");
  });
});

describe("leap year handling", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2024-02-28T00:00:00Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("isoDateInNDays spans leap day", () => {
    expect(isoDateInNDays(1)).toBe("2024-02-29");
    expect(isoDateInNDays(2)).toBe("2024-03-01");
  });

  it("calculateRentalDays counts leap day", () => {
    expect(calculateRentalDays("2024-03-01")).toBe(2);
  });
});

