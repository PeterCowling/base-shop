describe("Shop order flow", () => {
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

  it("browses products, edits cart quantities, and completes an order", () => {
    cy.visit("/login");
    cy.get('input[name="customerId"]').type("cust1");
    cy.get('input[name="password"]').type("pass1");
    cy.contains("button", "Login").click();

    cy.visit("/en/shop");
    cy.contains("h3", "Eco Runner — Green")
      .parents("article")
      .find("a")
      .first()
      .click();

    cy.contains("button", "42").click();
    cy.get("#qty").clear().type("2");
    cy.contains("button", "Add to cart").click();

    cy.contains("a", "Cart").click();
    cy.wait("@createSession");
    cy.location("pathname").should("eq", "/en/checkout");

    cy.contains("td", "Eco Runner — Green")
      .siblings()
      .eq(0)
      .should("have.text", "2");

    cy.contains("button", "Pay").click();
    cy.wait("@confirmPayment");
    cy.location("pathname").should("eq", "/en/success");
    cy.contains("Thanks for your order!");

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

  it("has accessible checkout form inputs and validation", () => {
    cy.visit("/login");
    cy.get('input[name="customerId"]').type("cust1");
    cy.get('input[name="password"]').type("pass1");
    cy.contains("button", "Login").click();

    cy.visit("/en/checkout");
    cy.injectAxe();
    cy.checkA11y();

    cy.get('input[type="date"]').should(($input) => {
      const id = $input.attr("id");
      const ariaLabel = $input.attr("aria-label");
      const hasForLabel = !!id && Cypress.$(`label[for="${id}"]`).length > 0;
      const hasParentLabel = $input.closest("label").length > 0;
      expect(Boolean(ariaLabel) || hasForLabel || hasParentLabel).to.be.true;
    });

    cy.get('input[type="date"]').clear();
    cy.contains("button", "Pay").click();

    cy.get('input[type="date"]').should("have.attr", "aria-invalid", "true")
      .invoke("attr", "aria-describedby")
      .then((describedBy) => {
        expect(describedBy).to.exist;
        cy.get(`#${describedBy}`).should("be.visible");
      });
  });
});

