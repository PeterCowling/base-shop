import "@testing-library/cypress/add-commands";

describe("CMS settings – Returns functional", () => {
  const shop = "demo";
  const root = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  const settingsFile = `${root}/${shop}/settings.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("enables UPS returns and saves", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings/returns`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings/returns`);

    // Toggle UPS returns on
    cy.findByLabelText("UPS returns").click({ force: true });
    cy.findByRole("button", { name: /Save changes/i }).click();

    cy.readFile(settingsFile, { timeout: 5000 }).then((json: any) => {
      expect(json).to.have.nested.property("returnService.upsEnabled", true);
    });
  });
});

