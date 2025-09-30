import type { CookieValue } from "cypress";

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

describe("cms middleware", () => {
  before(() => {
    cy.task("testData:setup", SHOP)
      .then((dir) => {
        dataDir = dir as string;
        Cypress.env("TEST_DATA_ROOT", dir);
      })
      .then(() => {
        const product = {
          id: "1",
          sku: "sku1",
          title: { en: "Demo" },
          description: { en: "" },
          price: 0,
          currency: "EUR",
          media: [],
          status: "draft",
          shop: SHOP,
          row_version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const settings = {
          languages: ["en"],
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

  beforeEach(() => {
    cy.clearCookie("next-auth.session-token");
  });

  it("redirects unauthenticated users to login", () => {
    cy.request({
      url: `/cms/shop/${SHOP}`,
      followRedirect: false,
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(307);
      expect(resp.headers.location).to.include("/login");
    });
  });

  it("blocks viewers from editing products", () => {
    sign("viewer").then((token: CookieValue) => {
      cy.setCookie("next-auth.session-token", token);
      cy.visit(`/cms/shop/${SHOP}/products/1/edit`, {
        failOnStatusCode: false,
      });
      cy.contains("403 – Access denied");
    });
  });

  it("allows admins to edit products", () => {
    sign("admin").then((token: CookieValue) => {
      cy.setCookie("next-auth.session-token", token);
      cy.visit(`/cms/shop/${SHOP}/products/1/edit`);
      cy.contains("h1", `Edit product – ${SHOP}/1`);
    });
  });
});

