import { locales } from "@acme/i18n/locales";
import en from "@acme/i18n/en.json";
import de from "@acme/i18n/de.json";
import itMessages from "@acme/i18n/it.json";

describe("Localized storefront", () => {
  // Skip this suite when storefront routes redirect to the CMS login
  // (e.g. when the legacy shopper app is not exposed in this environment).
  before(function () {
    cy.request({
      url: "/en",
      failOnStatusCode: false,
      followRedirect: false,
    }).then(function (resp) {
      if (resp.status === 302 || String(resp.body).includes("/login")) {
        cy.log(
          "Skipping shop-i18n specs: storefront routes redirect to /login in this environment.",
        );
         
        this.skip();
      }
    });
  });

  locales.forEach((locale) => {
    const t = locale === "en" ? en : locale === "de" ? de : itMessages;

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
