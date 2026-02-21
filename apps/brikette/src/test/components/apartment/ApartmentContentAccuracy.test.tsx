/**
 * Apartment content accuracy tests (TASK-01 validation)
 *
 * Verifies that apartmentPage.json copy aligns with the revenue architecture
 * brief and contains no factual inaccuracies or brand-safety violations.
 */
import translations from "@/locales/en/apartmentPage.json";

describe("Apartment content accuracy", () => {
  describe("SEO metadata", () => {
    // TC-01: meta.title contains "Positano"
    it("meta title targets Positano keyword cluster", () => {
      expect(translations.meta.title).toMatch(/Positano/i);
    });

    // TC-02: meta.description contains step-free messaging
    it("meta description includes step-free or no stairs messaging", () => {
      expect(translations.meta.description).toMatch(/step-free|no stairs/i);
    });
  });

  describe("Details list factual accuracy", () => {
    // TC-03: detailsList contains correct items
    it("includes full kitchen and 2 bathrooms", () => {
      const details = translations.detailsList;
      expect(details.some((d: string) => /full kitchen/i.test(d))).toBe(true);
      expect(details.some((d: string) => /2.*bathroom/i.test(d))).toBe(true);
    });

    // TC-04: detailsList does NOT contain inaccurate claims
    it("does not contain kitchenette or sea-view balcony", () => {
      const detailsJoined = translations.detailsList.join(" ");
      expect(detailsJoined).not.toMatch(/kitchenette/i);
      expect(detailsJoined).not.toMatch(/sea-view balcony/i);
    });
  });

  describe("Brand safety", () => {
    // TC-05: highlights do not use the word "steps"
    it("highlight slides do not contain the word 'steps'", () => {
      for (const slide of translations.highlights.slides) {
        expect(slide.text.toLowerCase()).not.toContain("steps");
        expect(slide.title.toLowerCase()).not.toContain("steps");
      }
    });
  });

  describe("Price signal", () => {
    // TC-06: body or heroIntro contains price anchor
    it("body or heroIntro contains price signal (265)", () => {
      const combined = `${translations.body} ${translations.heroIntro}`;
      expect(combined).toMatch(/265/);
    });
  });

  describe("Amenities completeness", () => {
    // TC-07: amenitiesList includes 2 bathrooms
    it("amenities list includes 2 bathrooms", () => {
      expect(
        translations.amenitiesList.some((a: string) => /2.*bathroom/i.test(a)),
      ).toBe(true);
    });
  });
});
