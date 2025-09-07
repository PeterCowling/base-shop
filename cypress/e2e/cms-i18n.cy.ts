import { locales } from "@acme/i18n/locales";
import en from "@acme/i18n/en.json";
import de from "@acme/i18n/de.json";
import it from "@acme/i18n/it.json";
import type { CookieValue } from "cypress";

const messages: Record<string, Record<string, string>> = {
  en,
  de,
  it,
};

const SECRET = "test-nextauth-secret-32-chars-long-string!";
const SHOP = "demo";
let dataDir: string;

function sign(role: string) {
  return cy
    .exec(
      `node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({role:'${role}'},'${SECRET}'))"`
    )
    .its("stdout")
    .then((s) => s.trim());
}

describe("CMS i18n", () => {
  before(() => {
    cy.task("testData:setup", SHOP)
      .then((dir) => {
        dataDir = dir as string;
        Cypress.env("TEST_DATA_ROOT", dir);
      })
      .then(() => {
        const now = new Date().toISOString();
        const product = {
          id: "1",
          sku: "sku1",
          title: { en: "Demo", de: "Demo", it: "Demo" },
          description: { en: "", de: "", it: "" },
          price: 0,
          currency: "EUR",
          media: [],
          status: "draft",
          shop: SHOP,
          row_version: 1,
          created_at: now,
          updated_at: now,
        };
        const settings = {
          languages: locales,
          seo: {},
          currency: "EUR",
          taxRegion: "",
          updatedAt: "",
          updatedBy: "",
        };
        cy.writeFile(`${dataDir}/${SHOP}/products.json`, [product]);
        cy.writeFile(`${dataDir}/${SHOP}/settings.json`, settings);
      });
  });

  after(() => {
    cy.task("testData:cleanup");
  });

  locales.forEach((locale) => {
    const t = messages[locale];

    it(`renders ${locale} translations`, () => {
      cy.clearCookie("next-auth.session-token");
      sign("admin").then((token: CookieValue) => {
        cy.setCookie("next-auth.session-token", token);
        cy.visit(`/cms/shop/${SHOP}/products/1/edit?lang=${locale}`);
        cy.contains(t["cms.image.upload"]);
        cy.get("div.flex.h-screen.w-screen").should("have.css", "display", "flex");
        cy.get("aside").should("have.css", "width", "224px");
        cy.get("main").invoke("innerWidth").should("be.gt", 0);

        cy.visit(`/cms/shop/${SHOP}/themes/library?lang=${locale}`);
        cy.contains(t["cms.theme.library"]);
        cy.get("div.flex.h-screen.w-screen").should("have.css", "display", "flex");
        cy.get("aside").should("have.css", "width", "224px");
        cy.get("main").invoke("innerWidth").should("be.gt", 0);
      });
    });
  });
});

