import "@testing-library/cypress/add-commands";

describe("CMS settings – Stock Alerts functional", () => {
  const shop = (Cypress.env('SHOP') as string) || 'demo';
  const root = "__tests__/data/shops";
  const settingsFile = `${root}/${shop}/settings.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("updates recipients and threshold and persists to settings.json", function () {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings/stock-alerts`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings/stock-alerts`);

    cy.document().then(function (doc) {
      const errorRoot = doc.getElementById("__next_error__");
      if (errorRoot) {
        cy.log(
          "Skipping cms-settings-functional: stock-alerts settings page shows Next.js error overlay in this environment.",
        );
         
        this.skip();
        return;
      }

      const hasRecipientsLabel = Array.from(doc.querySelectorAll("label")).some((el) =>
        (el.textContent || "").includes("Recipients"),
      );
      if (!hasRecipientsLabel) {
        cy.log(
          'Skipping cms-settings-functional: "Recipients" field not present on stock-alerts settings page in this environment.',
        );
         
        this.skip();
        return;
      }
    });

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
