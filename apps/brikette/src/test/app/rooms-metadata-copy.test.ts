import deLocale from "@/locales/de/roomsPage.json";
import enLocale from "@/locales/en/roomsPage.json";
import frLocale from "@/locales/fr/roomsPage.json";
import itLocale from "@/locales/it/roomsPage.json";

describe("rooms metadata copy (TASK-08)", () => {
  it("EN title keeps Positano + rooms intent", () => {
    expect(enLocale.meta.title).toMatch(/positano/i);
    expect(enLocale.meta.title).toMatch(/rooms|rates|hostel/i);
  });

  it("EN description includes price signal and booking CTA", () => {
    expect(enLocale.meta.description).toMatch(/from eur 55\/night/i);
    expect(enLocale.meta.description).toMatch(/book direct/i);
    expect(enLocale.meta.description).toMatch(/private rooms|dorm beds/i);
  });

  it("IT/DE/FR rooms metadata remains populated after EN update", () => {
    const localePages = [itLocale, deLocale, frLocale];
    for (const localePage of localePages) {
      expect(localePage.meta.title.trim().length).toBeGreaterThan(0);
      expect(localePage.meta.description.trim().length).toBeGreaterThan(0);
      expect(localePage.meta.title).toMatch(/positano/i);
    }
  });
});
