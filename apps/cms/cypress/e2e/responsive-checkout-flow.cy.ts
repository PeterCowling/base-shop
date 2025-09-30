import { viewports } from "../support/viewports";

describe("Responsive checkout flow", () => {
  viewports.forEach(({ label, width, height }) => {
    it(`completes checkout at ${label} (${width}x${height})`, () => {
      cy.viewport(width, height);
      cy.intercept("POST", "**/api/checkout-session", {
        statusCode: 200,
        body: { clientSecret: "cs_test", sessionId: "sess_test" },
      }).as("createSession");
      cy.intercept("POST", "https://api.stripe.com/**", {
        statusCode: 200,
        body: {},
      }).as("confirmPayment");

      cy.request("POST", "/api/cart", {
        sku: { id: "green-sneaker" },
        qty: 1,
        size: "42",
      });

      cy.visit("/cart");
      cy.injectAxe();
      cy.checkA11y();
      cy.contains("Your Bag").should("be.visible");
      cy.contains(/Checkout/i).click();
      cy.wait("@createSession");

      cy.location("pathname").should("include", "/checkout");
      cy.injectAxe();
      cy.checkA11y();
      cy.contains("button", "Pay").click();
      cy.wait("@confirmPayment");

      cy.location("pathname").should("include", "/success");
      cy.injectAxe();
      cy.contains("Thanks for your order!").should("be.visible");
      cy.checkA11y();
    });
  });
});
