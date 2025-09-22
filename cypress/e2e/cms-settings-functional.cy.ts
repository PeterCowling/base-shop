import "@testing-library/cypress/add-commands";

describe("CMS settings – Stock Alerts functional", () => {
  const shop = "demo";
  const settingsFile = `${(Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops"}/${shop}/settings.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("updates recipients and threshold and persists to settings.json", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings/stock-alerts`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings/stock-alerts`);

    // Fill in valid values
    cy.findByLabelText("Recipients").clear().type("ops@example.com, alerts@example.com");
    cy.findByLabelText("Webhook URL").clear().type("https://example.com/alerts");
    cy.findByLabelText("Default threshold").clear().type("3");

    // Save
    cy.findByRole("button", { name: /Save changes/i }).click();

    // Confirm UI shows success toast and field reflects normalized values
    cy.contains("Stock alert settings saved.").should("exist");

    // Verify persisted file contents
    cy.readFile(settingsFile, { timeout: 5000 }).then((json: any) => {
      expect(json).to.have.property("stockAlert");
      expect(json.stockAlert).to.include({ webhook: "https://example.com/alerts", threshold: 3 });
      expect(json.stockAlert.recipients).to.deep.equal(["ops@example.com", "alerts@example.com"]);
    });
  });
});

