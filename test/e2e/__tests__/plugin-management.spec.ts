// test/e2e/plugin-management.spec.ts

describe("Plugin management", () => {
  const login = () => cy.loginAsAdmin();

  before(() => {
    cy.session("admin-session", login);
  });

  it("lists installed plugins", () => {
    cy.session("admin-session", login);

    cy.visit("/cms/plugins");

    cy.contains("h2", "Plugins").should("be.visible");

    // Core plugins discovered from the workspace
    ["PayPal", "Sanity", "Premier Shipping"].forEach((name) => {
      cy.contains("li", name).should("be.visible");
    });
  });
});
