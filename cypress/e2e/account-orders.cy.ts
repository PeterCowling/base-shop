import type { OrderStep } from "@ui/components/organisms/OrderTrackingTimeline";

function login() {
  cy.visit("/login");
  cy.get('input[name="customerId"]').type("cust1");
  cy.get('input[name="password"]').type("pass1");
  cy.contains("button", "Login").click();
  cy.getCookie("customer_session").should("exist");
}

describe("Account orders", () => {
  it("shows customer orders and details", () => {
    const orderId = "ord_123";

    // seed order list response before visiting page
    cy.intercept("GET", "/api/orders", {
      statusCode: 200,
      body: [
        {
          id: orderId,
          status: "shipped",
          trackingNumber: "TRACK123",
        },
      ],
    }).as("orders");

    // stub tracking info when navigating to detail page
    cy.intercept("GET", `/api/orders/${orderId}/tracking`, {
      statusCode: 200,
      body: {
        steps: [
          { label: "Shipped", date: "2024-01-01", complete: true },
        ] as OrderStep[],
      },
    }).as("tracking");

    login();
    cy.visit("/account/orders");
    cy.wait("@orders");

    cy.contains(`Order: ${orderId}`).should("be.visible");
    cy.contains("Status: shipped").should("be.visible");

    // optional: view order detail
    cy.contains(`Order: ${orderId}`).click();
    cy.location("pathname").should("eq", `/account/orders/${orderId}`);
    cy.wait("@tracking");
    cy.contains(`Order ${orderId}`).should("be.visible");
  });
});

