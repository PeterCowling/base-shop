import "@testing-library/cypress/add-commands";

describe("CMS settings – Configuration overview reflects persisted values", () => {
  const shop = "demo";
  const root = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  const shopFile = `${root}/${shop}/shop.json`;
  const settingsFile = `${root}/${shop}/settings.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("renders languages, currency, tax region, and theme preset", () => {
    // Seed files with known values
    cy.readFile(shopFile).then((shopJson: any) => {
      shopJson.themeId = "bcd-classic";
      cy.writeFile(shopFile, shopJson);
    });
    cy.readFile(settingsFile).then((settingsJson: any) => {
      settingsJson.languages = ["en", "it"];
      settingsJson.currency = "USD";
      settingsJson.taxRegion = "US-NY";
      cy.writeFile(settingsFile, settingsJson);
    });

    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings`);

    // Configuration overview assertions
    cy.contains('h2', 'Configuration overview').should('exist');
    // Languages list shows uppercased codes
    cy.contains('li', 'EN').should('exist');
    cy.contains('li', 'IT').should('exist');

    // Commerce defaults
    cy.contains('dt', 'Currency').next('dd').should('contain.text', 'USD');
    cy.contains('dt', 'Tax region').next('dd').should('contain.text', 'US-NY');
    cy.contains('dt', 'Theme preset').next('dd').should('contain.text', 'bcd-classic');
  });
});

