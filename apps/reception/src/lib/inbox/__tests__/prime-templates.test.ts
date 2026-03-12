import {
  allTemplates,
  formatTemplateForDraft,
  getTemplateById,
  matchTemplates,
} from "../prime-templates";

describe("prime-templates", () => {
  describe("matchTemplates", () => {
    it("returns booking template for check-in query", () => {
      const results = matchTemplates("how do I check in");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].id).toBe("booking");
    });

    it("returns transport template for bus query", () => {
      const results = matchTemplates("bus to positano");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].id).toBe("transport");
    });

    it("returns food template for breakfast query", () => {
      const results = matchTemplates("breakfast options");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].id).toBe("food");
    });

    it("returns empty array for unrecognised query", () => {
      const results = matchTemplates("random gibberish xyz");
      expect(results).toEqual([]);
    });

    it("returns empty array for empty input", () => {
      expect(matchTemplates("")).toEqual([]);
    });

    it("returns empty array for whitespace-only input", () => {
      expect(matchTemplates("   ")).toEqual([]);
    });

    it("is case insensitive", () => {
      const lower = matchTemplates("check in");
      const upper = matchTemplates("CHECK IN");
      expect(lower).toEqual(upper);
    });

    it("returns multiple templates ranked by match count for multi-topic query", () => {
      const results = matchTemplates("extend my booking and check activities");
      expect(results.length).toBeGreaterThanOrEqual(2);
      // "extension" matches "extend" (1 hit); "booking" matches "booking" (1 hit)
      // "experiences" matches "activities" (1 hit)
      const ids = results.map((r) => r.id);
      expect(ids).toContain("extension");
      expect(ids).toContain("experiences");
    });

    it("returns bag_drop template for luggage query", () => {
      const results = matchTemplates("where can I leave my luggage");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].id).toBe("bag_drop");
    });
  });

  describe("allTemplates", () => {
    it("returns all templates", () => {
      const templates = allTemplates();
      // 6 templates: booking, extension, experiences, food, bag_drop, transport
      expect(templates.length).toBe(6);
    });

    it("every template has non-empty EN and IT answers", () => {
      for (const template of allTemplates()) {
        expect(template.answer.en.length).toBeGreaterThan(0);
        expect(template.answer.it.length).toBeGreaterThan(0);
      }
    });

    it("every template has at least one link with label and href", () => {
      for (const template of allTemplates()) {
        expect(template.links.length).toBeGreaterThanOrEqual(1);
        for (const link of template.links) {
          expect(link.label.length).toBeGreaterThan(0);
          expect(link.href.length).toBeGreaterThan(0);
        }
      }
    });

    it("returns a copy (not the internal array)", () => {
      const a = allTemplates();
      const b = allTemplates();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe("getTemplateById", () => {
    it("returns the correct template for a valid ID", () => {
      const template = getTemplateById("booking");
      expect(template).toBeDefined();
      expect(template!.id).toBe("booking");
      expect(template!.category).toBe("booking");
    });

    it("returns undefined for an unknown ID", () => {
      expect(getTemplateById("nonexistent")).toBeUndefined();
    });
  });

  describe("formatTemplateForDraft", () => {
    it("includes answer text and link lines in EN", () => {
      const template = getTemplateById("booking")!;
      const formatted = formatTemplateForDraft(template, "en");
      expect(formatted).toContain(template.answer.en);
      expect(formatted).toContain("Booking details: /booking-details");
      expect(formatted).toContain("Find my stay: /find-my-stay");
    });

    it("uses IT answer text when locale is it", () => {
      const template = getTemplateById("booking")!;
      const formatted = formatTemplateForDraft(template, "it");
      expect(formatted).toContain(template.answer.it);
    });

    it("separates answer and links with a blank line", () => {
      const template = getTemplateById("food")!;
      const formatted = formatTemplateForDraft(template, "en");
      const parts = formatted.split("\n\n");
      expect(parts.length).toBe(2);
      expect(parts[0]).toBe(template.answer.en);
    });
  });
});
