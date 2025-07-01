// test/e2e/shop-wizard.spec.ts

describe("Shop wizard", () => {
  const shopId = `cyshop-${Date.now()}`;

  it("creates a shop via the wizard", () => {
    cy.intercept("POST", "/cms/api/create-shop").as("createShop");

    // ensure we land back on the wizard page after signing in
    cy.visit("/login?callbackUrl=/cms/wizard");
    cy.get('input[name="email"]').type("admin@example.com");
    cy.get('input[name="password"]').type("admin");
    cy.contains("button", "Continue").click();

    cy.location("pathname").should("eq", "/cms/wizard");

    // Step 0 - id and template
    cy.get('input[placeholder="my-shop"]').type(shopId);
    cy.contains("button", "Next").click();

    // Step 1 - theme selection
    cy.contains("button", "Next").click();

    // Step 2 - options
    cy.contains("label", "Stripe").click();
    cy.contains("label", "DHL").click();
    cy.contains("button", "Next").click();

    // Step 3 - submit
    cy.contains("button", "Create Shop").click();

    cy.wait("@createShop")
      .its("request.body")
      .then((body: any) => {
        expect(body.id).to.equal(shopId);
        expect(body.payment).to.deep.equal(["stripe"]);
        expect(body.shipping).to.deep.equal(["dhl"]);
        expect(body.template).to.be.a("string");
        expect(body.theme).to.be.a("string");
      });

    cy.contains("Shop created successfully");

    cy.readFile(`data/shops/${shopId}/shop.json`)
      .its("id")
      .should("eq", shopId);

    // sign out to reset auth state
    cy.contains("Sign out").click();
    cy.location("pathname").should("eq", "/login");
  });
});
