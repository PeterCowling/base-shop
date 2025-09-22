import "@testing-library/cypress/add-commands";

describe("CMS settings – SEO warnings (length)", () => {
  const shop = "demo";
  const root = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  const settingsFile = `${root}/${shop}/settings.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("shows warning toast for long title/description and persists values", () => {
    const longTitle = "T".repeat(80); // > 70 chars
    const longDesc = "D".repeat(200); // > 160 chars

    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings/seo`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings/seo`);

    cy.findByLabelText("Title").clear().type(longTitle);
    cy.findByLabelText("Description").clear().type(longDesc);

    cy.findByRole("button", { name: /^Save$/ }).click();

    // Toast indicates warnings
    cy.contains("Metadata saved with warnings").should("exist");

    // Values persisted under current locale (en)
    cy.readFile(settingsFile, { timeout: 5000 }).then((json: any) => {
      expect(json).to.have.nested.property("seo.en.title", longTitle);
      expect(json).to.have.nested.property("seo.en.description", longDesc);
    });
  });
});

