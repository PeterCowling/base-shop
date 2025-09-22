import "@testing-library/cypress/add-commands";

describe("CMS settings – Providers (tracking) functional", () => {
  const shop = "demo";
  const root = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  const settingsFile = `${root}/${shop}/settings.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("selects DHL and UPS and persists trackingProviders", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings`);

    // Tick provider checkboxes by clicking their labels
    cy.contains('label', 'DHL').click();
    cy.contains('label', 'UPS').click();

    // Save
    cy.findByRole("button", { name: /^Save$/ }).click();

    // Assert settings.json contains selected providers
    cy.readFile(settingsFile, { timeout: 5000 }).then((json: any) => {
      const list = (json.trackingProviders || []).sort();
      expect(list).to.include.members(["dhl", "ups"]);
    });
  });
});
