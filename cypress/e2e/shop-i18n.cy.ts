import { locales } from "@acme/i18n/locales";
import en from "@acme/i18n/en.json";
import de from "@acme/i18n/de.json";
import it from "@acme/i18n/it.json";

const messages: Record<string, Record<string, string>> = {
  en,
  de,
  it,
};

describe("Localized storefront", () => {
  locales
    .filter((locale) => locale !== "en")
    .forEach((locale) => {
      const t = messages[locale];

      describe(`${locale} translations`, () => {
        it("renders home hero and value strings", () => {
          cy.visit(`/${locale}`);
          cy.contains(t["hero.cta"]);
          cy.contains(t["value.eco.title"]);
        });

        it("renders checkout strings", () => {
          cy.visit(`/${locale}/checkout`);
          cy.contains(t["checkout.pay"]);
          cy.contains(t["checkout.return"]);
        });

        it("renders product page strings", () => {
          cy.visit(`/${locale}/product/green-sneaker`);
          cy.contains(t["pdp.selectSize"]);
        });
      });
    });
});
