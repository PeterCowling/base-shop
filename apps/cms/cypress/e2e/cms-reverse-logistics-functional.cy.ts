import "@testing-library/cypress/add-commands";

describe("CMS settings – Reverse Logistics functional", () => {
  const shop = (Cypress.env('SHOP') as string) || 'demo';
  const root = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  const settingsFile = `${root}/${shop}/settings.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("updates interval and persists", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings/reverse-logistics`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings/reverse-logistics`);

    cy.findByLabelText("Interval (minutes)").clear().type("45");
    cy.findByRole("button", { name: /Save changes/i }).click();

    cy.readFile(settingsFile, { timeout: 5000 }).then((json: any) => {
      expect(json).to.have.nested.property("reverseLogisticsService.intervalMinutes", 45);
    });
  });
});
