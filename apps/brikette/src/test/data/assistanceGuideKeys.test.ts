import { GUIDE_KEYS } from "@/guides/slugs";

import { ASSISTANCE_GUIDE_KEYS, isAssistanceGuideKey } from "../../data/assistanceGuideKeys";

describe("assistanceGuideKeys", () => {
  describe("ASSISTANCE_GUIDE_KEYS", () => {
    it("contains exactly 12 keys", () => {
      expect(ASSISTANCE_GUIDE_KEYS).toHaveLength(12);
    });

    it("is frozen (immutable)", () => {
      expect(Object.isFrozen(ASSISTANCE_GUIDE_KEYS)).toBe(true);
    });

    it("contains all expected assistance article keys", () => {
      const expectedKeys = [
        "ageAccessibility",
        "arrivingByFerry",
        "bookingBasics",
        "changingCancelling",
        "checkinCheckout",
        "defectsDamages",
        "depositsPayments",
        "legal",
        "naplesAirportBus",
        "rules",
        "security",
        "travelHelp",
      ];

      for (const key of expectedKeys) {
        expect(ASSISTANCE_GUIDE_KEYS).toContain(key);
      }
    });

    it("contains only valid GuideKeys", () => {
      const guideKeySet = new Set(GUIDE_KEYS);
      for (const key of ASSISTANCE_GUIDE_KEYS) {
        expect(guideKeySet.has(key)).toBe(true);
      }
    });
  });

  describe("isAssistanceGuideKey", () => {
    it("returns true for valid assistance guide keys", () => {
      expect(isAssistanceGuideKey("rules")).toBe(true);
      expect(isAssistanceGuideKey("bookingBasics")).toBe(true);
      expect(isAssistanceGuideKey("travelHelp")).toBe(true);
    });

    it("returns false for non-assistance guide keys", () => {
      expect(isAssistanceGuideKey("pathOfTheGods")).toBe(false);
      expect(isAssistanceGuideKey("onlyHostel")).toBe(false);
    });

    it("returns false for invalid strings", () => {
      expect(isAssistanceGuideKey("")).toBe(false);
      expect(isAssistanceGuideKey("notAGuideKey")).toBe(false);
      expect(isAssistanceGuideKey("RULES")).toBe(false); // case-sensitive
    });
  });
});
