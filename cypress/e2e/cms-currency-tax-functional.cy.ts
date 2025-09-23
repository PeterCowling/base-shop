import "@testing-library/cypress/add-commands";

describe("CMS settings – Currency & Tax functional", () => {
  const shop = (Cypress.env('SHOP') as string) || 'demo';
  const root = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  const settingsFile = `${root}/${shop}/settings.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("updates currency and tax region and persists", () => {
    const currency = `USD`;
    const taxRegion = `US-CA`;

    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings`);

    // Edit Currency & tax block
    cy.findByLabelText("Currency").clear().type(currency);
    cy.findByLabelText("Tax Region").clear().type(taxRegion);
    cy.findByRole("button", { name: /^Save$/ }).click();

    // Verify persisted
    cy.readFile(settingsFile, { timeout: 5000 }).then((json: any) => {
      expect(json).to.include({ currency, taxRegion });
    });
  });
});
