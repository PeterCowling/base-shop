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

    cy.location("pathname", { timeout: 10000 }).should("eq", "/cms/wizard");

    // Step 0 - id and template
    cy.get('input[placeholder="my-shop"]').type(shopId);
    cy.contains("button", "Next").click();

    // Step 1 - theme selection
    cy.contains("button", "Next").click();

    // Step 2 - customize tokens
    cy.contains("button", "Next").click();

    // Step 3 - options
    cy.contains("label", "Stripe").click();
    cy.contains("label", "DHL").click();
    cy.contains("button", "Next").click();

    // Step 4 - home page
    cy.contains("button", "Next").click();

    // Step 5 - additional pages
    cy.contains("button", "Next").click();

    // Step 6 - summary and page info
    cy.get('input[placeholder="Home"]').clear().type("My Title");
    cy.get('input[placeholder="Page description"]').type("My description");
    cy.get('input[placeholder="https://example.com/og.png"]').type(
      "https://example.com/img.png"
    );

    cy.contains("button", "Create Shop").click();

    cy.wait("@createShop")
      .its("request.body")
      .then((body: any) => {
        expect(body.id).to.equal(shopId);
        expect(body.options.payment).to.deep.equal(["stripe"]);
        expect(body.options.shipping).to.deep.equal(["dhl"]);
        expect(body.options.template).to.be.a("string");
        expect(body.options.theme).to.be.a("string");
        expect(body.options.pageTitle.en).to.equal("My Title");
        expect(body.options.pageDescription.en).to.equal("My description");
        expect(body.options.socialImage).to.equal(
          "https://example.com/img.png"
        );
      });

    cy.contains("Shop created successfully");

    cy.readFile(`data/shops/${shopId}/shop.json`).then((json) => {
      expect(json.id).to.equal(shopId);
      expect(json.homeTitle.en).to.equal("My Title");
    });

    cy.readFile(`data/shops/${shopId}/pages.json`) // ensure page metadata saved
      .its("0.seo.title.en")
      .should("eq", "My Title");

    // sign out to reset auth state
    cy.contains("Sign out").click();
    cy.location("pathname").should("eq", "/login");
  });
});
