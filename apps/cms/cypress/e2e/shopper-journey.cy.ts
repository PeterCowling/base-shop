describe("Shopper journey", { tags: ["smoke"] }, () => {
  beforeEach(() => {
    cy.intercept("POST", "**/api/checkout-session", {
      statusCode: 200,
      body: { clientSecret: "cs_test", sessionId: "sess_test" },
    }).as("createSession");
    cy.intercept("POST", "https://api.stripe.com/**", {
      statusCode: 200,
      body: {},
    }).as("confirmPayment");
  });

  after(() => {
    cy.task("testData:cleanup");
  });

  it("completes a full shopper journey", function () {
    cy.request("/login").then((resp) => {
      if (!resp.body.includes('name="customerId"')) {
        cy.log("Skipping shopper-journey spec: legacy shopper login form is not present");
        this.skip();
        return;
      }

      // Login
      cy.visit("/login");
      cy.get('input[name="customerId"]').type("cust1");
      cy.get('input[name="password"]').type("pass1");
      cy.contains("button", "Login").click();

      // Browse & filter
      cy.visit("/en/shop");
      cy.get('input[aria-label="Search products"]').type("Green");
      cy.get("article").should("have.length", 1);
      cy.contains("label", "Color").find("select").select("black");
      cy.get("article")
        .should("have.length", 1)
        .and("contain", "Eco Runner — Black");
      cy.contains("label", "Max Price")
        .find("input")
        .clear()
        .type("100");
      cy.get("article").should("have.length", 0);
      cy.contains("button", "Clear Filters").click();
      cy.get("article").its("length").should("be.gte", 1);

      // Add sale item
      cy.contains("h3", "Eco Runner — Green")
        .parents("article")
        .find("a")
        .first()
        .click();
      cy.contains("button", "42").click();
      cy.get("#qty").clear().type("1");
      cy.contains("button", "Add to cart").click();

      // Add rental item
      cy.visit("/en/shop");
      cy.contains("h3", "Eco Runner — Sand")
        .parents("article")
        .find("a")
        .first()
        .click();
      cy.contains("button", "42").click();
      cy.get("#qty").clear().type("1");
      cy.contains("button", "Add to cart").click();

      // Modify cart quantities via mini cart
      cy.contains("button", "Cart").click();
      cy.get('button[aria-label="Increase quantity"]').first().click();
      cy.get('button[aria-label="Decrease quantity"]').first().click();

      // Checkout
      cy.contains("a", "Cart").click();
      cy.wait("@createSession");
      cy.location("pathname").should("eq", "/en/checkout");

      cy.contains("td", "Subtotal").next().should("contain", "238");
      cy.contains("td", "Deposit").next().should("contain", "100");
      cy.contains("td", "Total").next().should("contain", "338");

      cy.contains("button", "Pay").click();
      cy.wait("@confirmPayment");
      cy.location("pathname").should("eq", "/en/success");
      cy.contains("Thanks for your order!");

      // Record order
      cy.request("POST", "/api/stripe-webhook", {
        type: "checkout.session.completed",
        data: {
          object: {
            id: "sess_test",
            metadata: {
              depositTotal: "0",
              returnDate: "2030-01-01",
              customerId: "cust1",
            },
          },
        },
      });

      cy.visit("/account/orders");
      cy.contains("Order:").should("exist");
    });
  });
});
