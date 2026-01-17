import type { OrderStep } from "@acme/ui/components/organisms/OrderTrackingTimeline";

describe("Account orders", () => {
  // Skip when the shopper login endpoint is not available in this deployment.
  before(function () {
    cy.request({
      method: "HEAD",
      url: "/api/login",
      failOnStatusCode: false,
    }).then((resp) => {
      if (resp.status === 404) {
        cy.log("Skipping account orders specs: /api/login not present on this host.");
        this.skip();
      }
    });
  });

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

    cy.customerLogin();
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
