import "@testing-library/cypress/add-commands";

describe("CMS settings – Stock Alerts validation (negative)", () => {
  const shop = "demo";
  const root = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  const settingsFile = `${root}/${shop}/settings.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("shows validation errors for invalid emails and threshold", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings/stock-alerts`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings/stock-alerts`);

    // Invalid recipients and threshold
    cy.findByLabelText("Recipients").clear().type("not-an-email");
    cy.findByLabelText("Default threshold").clear().type("0");

    cy.findByRole("button", { name: /Save changes/i }).click();

    // Error chips should appear and an error announcement toast should be shown
    cy.contains("Invalid email: not-an-email").should("exist");
    cy.contains("Enter a threshold of at least 1.").should("exist");

    // settings.json should not contain stockAlert (no changes persisted)
    cy.readFile(settingsFile, { timeout: 5000 }).then((json: any) => {
      expect(json.stockAlert).to.be.undefined;
    });
  });
});

