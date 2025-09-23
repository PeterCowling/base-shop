import "@testing-library/cypress/add-commands";

describe("CMS settings – Deposits functional", () => {
  const shop = (Cypress.env('SHOP') as string) || 'demo';
  const root = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  const settingsFile = `${root}/${shop}/settings.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("enables deposit release and updates interval", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings/deposits`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings/deposits`);

    // Toggle on and set interval
    cy.findByLabelText("Deposit release").click({ force: true });
    cy.findByLabelText("Interval (minutes)").clear().type("15");
    cy.findByRole("button", { name: /Save changes/i }).click();

    cy.readFile(settingsFile, { timeout: 5000 }).then((json: any) => {
      expect(json).to.have.nested.property("depositService.enabled", true);
      expect(json).to.have.nested.property("depositService.intervalMinutes", 15);
    });
  });
});
