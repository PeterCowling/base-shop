import "@testing-library/cypress/add-commands";

describe("CMS settings – Maintenance Scan functional (toast only)", () => {
  const shop = "demo";

  it("updates frequency and shows success toast", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings/maintenance-scan`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings/maintenance-scan`);

    cy.findByLabelText("Scan frequency (ms)").clear().type("10000");
    cy.findByRole("button", { name: /Save changes/i }).click();

    cy.contains("Maintenance scan schedule updated.").should("exist");
  });
});

