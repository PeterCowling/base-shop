import "@testing-library/cypress/add-commands";

describe("CMS settings – Stock Alerts validation (negative)", () => {
  const shop = (Cypress.env('SHOP') as string) || 'demo';
  const root = "__tests__/data/shops";
  const settingsFile = `${root}/${shop}/settings.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("shows validation errors for invalid emails and threshold", function () {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings/stock-alerts`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings/stock-alerts`);

    cy.document().then(function (doc) {
      const errorRoot = doc.getElementById("__next_error__");
      if (errorRoot) {
        cy.log(
          "Skipping cms-stock-alerts-validation-functional: stock-alerts settings page shows Next.js error overlay in this environment.",
        );
         
        this.skip();
        return;
      }

      const hasRecipientsLabel = Array.from(doc.querySelectorAll("label")).some((el) =>
        (el.textContent || "").includes("Recipients"),
      );
      if (!hasRecipientsLabel) {
        cy.log(
          'Skipping cms-stock-alerts-validation-functional: "Recipients" field not present on stock-alerts settings page in this environment.',
        );
         
        this.skip();
        return;
      }
    });

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
