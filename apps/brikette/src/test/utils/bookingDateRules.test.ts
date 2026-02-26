import "@testing-library/jest-dom";

import {
  ensureMinCheckoutForStay,
  getMinCheckoutForStay,
  HOSTEL_MIN_STAY_NIGHTS,
  isValidMinStayRange,
} from "@/utils/bookingDateRules";

describe("bookingDateRules", () => {
  it("uses a two-night minimum stay", () => {
    expect(HOSTEL_MIN_STAY_NIGHTS).toBe(2);
  });

  describe("getMinCheckoutForStay", () => {
    it("returns checkin + 2 nights", () => {
      expect(getMinCheckoutForStay("2026-04-24")).toBe("2026-04-26");
    });

    it("returns null for malformed checkin", () => {
      expect(getMinCheckoutForStay("bad-date")).toBeNull();
      expect(getMinCheckoutForStay("2026-04-99")).toBeNull();
    });
  });

  describe("isValidMinStayRange", () => {
    it("accepts exactly two nights", () => {
      expect(isValidMinStayRange("2026-04-24", "2026-04-26")).toBe(true);
    });

    it("accepts longer stays", () => {
      expect(isValidMinStayRange("2026-04-24", "2026-04-28")).toBe(true);
    });

    it("rejects stays shorter than two nights", () => {
      expect(isValidMinStayRange("2026-04-24", "2026-04-25")).toBe(false);
      expect(isValidMinStayRange("2026-04-24", "2026-04-24")).toBe(false);
    });
  });

  describe("ensureMinCheckoutForStay", () => {
    it("bumps missing/invalid checkout to minimum checkout", () => {
      expect(ensureMinCheckoutForStay("2026-04-24", "")).toBe("2026-04-26");
      expect(ensureMinCheckoutForStay("2026-04-24", "2026-04-25")).toBe("2026-04-26");
      expect(ensureMinCheckoutForStay("2026-04-24", "not-a-date")).toBe("2026-04-26");
    });

    it("preserves checkout when it already satisfies minimum stay", () => {
      expect(ensureMinCheckoutForStay("2026-04-24", "2026-04-26")).toBe("2026-04-26");
      expect(ensureMinCheckoutForStay("2026-04-24", "2026-04-28")).toBe("2026-04-28");
    });
  });
});
