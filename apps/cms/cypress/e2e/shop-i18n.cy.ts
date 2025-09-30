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
  locales.forEach((locale) => {
    const t = messages[locale];

    describe(`${locale} translations`, () => {
      it("renders home hero and verifies layout", () => {
        cy.viewport(1280, 800);
        cy.visit(`/${locale}`);
        cy.contains(t["hero.cta"]);
        cy.contains(t["value.eco.title"]);
        cy.get('nav[aria-label="Main navigation"]').should(
          "have.css",
          "flex-direction",
          "row",
        );
        cy.get('[style*="grid-template-columns"]')
          .first()
          .invoke("attr", "style")
          .then((style) => {
            const match = /repeat\((\d+)/.exec(style || "");
            const count = match ? Number(match[1]) : 0;
            expect(count).to.eq(4);
          });
      });

      it("renders checkout strings and layout", () => {
        cy.viewport(1280, 800);
        cy.visit(`/${locale}/checkout`);
        cy.contains(t["checkout.pay"]);
        cy.contains(t["checkout.return"]);
        cy.get('nav[aria-label="Main navigation"]').should(
          "have.css",
          "flex-direction",
          "row",
        );
        cy.get("main > div")
          .first()
          .should("have.css", "flex-direction", "column");
      });

      it("renders product page strings and layout", () => {
        cy.viewport(1280, 800);
        cy.visit(`/${locale}/product/green-sneaker`);
        cy.contains(t["pdp.selectSize"]);
        cy.get('nav[aria-label="Main navigation"]').should(
          "have.css",
          "flex-direction",
          "row",
        );
        cy.get("main > div")
          .first()
          .should("have.css", "display", "grid")
          .invoke("attr", "style")
          .then((style) => {
            const match = /repeat\((\d+)/.exec(style || "");
            const count = match ? Number(match[1]) : 0;
            expect(count).to.eq(2);
          });
      });
    });
  });
});
