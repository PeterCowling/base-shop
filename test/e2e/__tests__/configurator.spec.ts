// test/e2e/configurator.spec.ts

describe("Shop configurator flow", () => {
  const shopId = `config-${Date.now()}`;
  const dataDir = Cypress.env("TEST_DATA_ROOT") || "__tests__/data/shops";
  const shopDir = `${dataDir}/${shopId}`;

  before(() => {
    cy.request("/api/auth/csrf").then(({ body }) => {
      cy.request({
        method: "POST",
        url: "/api/auth/callback/credentials",
        form: true,
        followRedirect: true,
        body: {
          csrfToken: body.csrfToken,
          email: "admin@example.com",
          password: "admin",
          callbackUrl: "/cms/configurator",
        },
      });
    });
  });

  it("creates and launches a shop", () => {
    // Visit dashboard then Shop Details step
    cy.visit("/cms/configurator/shop-details");

    // Fill out shop details
    cy.get('input[placeholder="my-shop"]').clear().type(shopId);
    cy.get('input[placeholder="My Store"]').clear().type(`Store ${shopId}`);
    cy.get('input[placeholder="https://example.com/logo.png"]').type(
      "https://example.com/logo.png"
    );
    cy.get('input[placeholder="Email or phone"]').type("admin@example.com");
    cy.contains("label", "Shop Type").find('[role="combobox"]').click();
    cy.contains('[role="option"]', "Sale").click();
    cy.contains("label", "Template").find('[role="combobox"]').click();
    cy.get('[role="option"]').first().click();
    cy.contains("button", "Save & return").click();

    // Verify state persisted
    cy.request("/cms/api/configurator-progress")
      .its("body.state")
      .should("include", { shopId, storeName: `Store ${shopId}` });

    // Complete Theme step -> Tokens -> Options
    cy.visit("/cms/configurator/theme");
    cy.contains("button", "Next").click();
    cy.contains("button", "Save & return").click();
    cy.visit("/cms/configurator/options");
    cy.contains("button", "Save & return").click();

    // Mark remaining steps complete so Launch Shop is enabled
    const extraSteps = [
      "navigation",
      "layout",
      "home-page",
      "checkout-page",
      "shop-page",
      "product-page",
      "additional-pages",
      "env-vars",
    ];
    cy.wrap(extraSteps).each((step) => {
      cy.request("PATCH", "/cms/api/configurator-progress", {
        stepId: step as string,
        completed: "complete",
      });
    });

    // Complete Summary step
    cy.visit("/cms/configurator/summary");
    cy.contains("button", "Save & return").click();

    // Launch shop
    cy.visit("/cms/configurator");
    cy.contains("button", "Launch Shop").should("not.be.disabled").click();
    cy.contains("create: success", { timeout: 60000 }).should("be.visible");
    cy.contains("deploy: success", { timeout: 60000 }).should("be.visible");

    // Verify shop files written
    cy.readFile(`${shopDir}/shop.json`).its("slug").should("eq", shopId);

    // Clean up generated files
    cy.exec(`rm -rf ${shopDir}`);
  });
});
