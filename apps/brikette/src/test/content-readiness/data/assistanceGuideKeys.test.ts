import { GUIDE_KEYS } from "@/guides/slugs";

import { ASSISTANCE_GUIDE_KEYS, isAssistanceGuideKey } from "@/data/assistanceGuideKeys";
import { ASSISTANCE_TAGS } from "@/data/assistance.tags";

describe("assistanceGuideKeys", () => {
  describe("ASSISTANCE_GUIDE_KEYS", () => {
    it("is frozen (immutable)", () => {
      expect(Object.isFrozen(ASSISTANCE_GUIDE_KEYS)).toBe(true);
    });

    it("matches the keys defined by ASSISTANCE_TAGS", () => {
      expect(new Set(ASSISTANCE_GUIDE_KEYS)).toEqual(new Set(Object.keys(ASSISTANCE_TAGS)));
    });

    it("contains no duplicates", () => {
      expect(new Set(ASSISTANCE_GUIDE_KEYS).size).toBe(ASSISTANCE_GUIDE_KEYS.length);
    });

    it("contains only valid GuideKeys", () => {
      const guideKeySet = new Set(GUIDE_KEYS);
      for (const key of ASSISTANCE_GUIDE_KEYS) {
        expect(guideKeySet.has(key)).toBe(true);
      }
    });
  });

  describe("isAssistanceGuideKey", () => {
    it("returns true for every assistance guide key", () => {
      for (const key of ASSISTANCE_GUIDE_KEYS) {
        expect(isAssistanceGuideKey(key)).toBe(true);
      }
    });

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
