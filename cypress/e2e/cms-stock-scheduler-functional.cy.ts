import "@testing-library/cypress/add-commands";

describe("CMS settings – Stock Scheduler functional (toast only)", () => {
  const shop = "demo";

  it("updates interval and shows success toast", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings/stock-scheduler`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings/stock-scheduler`);

    cy.findByLabelText("Check interval (ms)").clear().type("5000");
    cy.findByRole("button", { name: /Save changes/i }).click();

    cy.contains("Stock scheduler updated.").should("exist");
  });
});

