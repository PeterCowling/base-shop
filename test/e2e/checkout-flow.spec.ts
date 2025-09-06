// test/e2e/checkout-flow.spec.ts

// This spec verifies the happy path and cancellation path when
// completing checkout. Stripe network requests are intercepted so the
// test does not rely on external services.

describe("Checkout success and cancel flows", () => {
  beforeEach(() => {
    // Intercept requests to the checkout session API. The URL may be absolute
    // or relative depending on how the app is served, so we use a wildcard
    // pattern to match both cases.
    cy.intercept("POST", "**/api/checkout-session", {
      statusCode: 200,
      body: { clientSecret: "cs_test", sessionId: "sess_test" },
    }).as("createSession");
  });

  it("redirects to success when payment succeeds", () => {
    cy.intercept("POST", "https://api.stripe.com/**", {
      statusCode: 200,
      body: {},
    }).as("confirmPayment");

    cy.visit("/en/checkout");
    cy.wait("@createSession");
    cy.contains("button", "Pay").click();
    cy.wait("@confirmPayment");
    cy.location("pathname").should("eq", "/en/success");
  });

  it("redirects to cancelled when payment fails", () => {
    cy.intercept("POST", "https://api.stripe.com/**", {
      statusCode: 402,
      body: { error: { message: "fail" } },
    }).as("confirmPayment");

    cy.visit("/en/checkout");
    cy.wait("@createSession");
    cy.contains("button", "Pay").click();
    cy.wait("@confirmPayment");
    cy.location("pathname").should("eq", "/en/cancelled");
  });

  it("allows retry after invalid coupon", () => {
    cy.intercept("POST", "https://api.stripe.com/**", {
      statusCode: 200,
      body: {},
    }).as("confirmPayment");

    cy.intercept(
      { method: "POST", url: "**/api/checkout-session", times: 1 },
      { statusCode: 400, body: { error: "Invalid coupon" } },
    ).as("createSessionFail");

    cy.visit("/en/checkout");
    cy.wait("@createSessionFail");
    cy.contains("Failed to load payment form.").should("be.visible");
    cy.contains("button", "Retry").click();
    cy.wait("@createSession");
    cy.contains("button", "Pay").click();
    cy.wait("@confirmPayment");
    cy.location("pathname").should("eq", "/en/success");
  });
});
