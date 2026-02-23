import deLocale from "@/locales/de/landingPage.json";
import enLocale from "@/locales/en/landingPage.json";
import frLocale from "@/locales/fr/landingPage.json";
import itLocale from "@/locales/it/landingPage.json";

describe("homepage metadata copy (TASK-07)", () => {
  it("EN title targets the hostel positano query cluster", () => {
    expect(enLocale.meta.title.toLowerCase()).toContain("hostel positano");
  });

  it("EN description keeps amalfi coast + booking intent", () => {
    expect(enLocale.meta.description).toMatch(/amalfi coast/i);
    expect(enLocale.meta.description).toMatch(/book|direct rates|reserve/i);
    expect(enLocale.meta.description).toMatch(/hostel/i);
  });

  it("EN hero H1 remains aligned with hostel + positano intent", () => {
    expect(enLocale.heroSection.title).toMatch(/hostel/i);
    expect(enLocale.heroSection.title).toMatch(/positano/i);
  });

  it("IT/DE/FR homepage metadata remains populated after EN update", () => {
    const localePages = [itLocale, deLocale, frLocale];
    for (const localePage of localePages) {
      expect(localePage.meta.title.trim().length).toBeGreaterThan(0);
      expect(localePage.meta.description.trim().length).toBeGreaterThan(0);
      expect(localePage.meta.title).toMatch(/positano/i);
    }
  });
});
