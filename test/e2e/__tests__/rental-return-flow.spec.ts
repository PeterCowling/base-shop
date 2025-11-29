// test/e2e/rental-return-flow.spec.ts

// This spec creates a rental order end-to-end and verifies it is refunded.

describe("Rental return flow", () => {
  const shopId = "bcd";
  const dataDir = Cypress.env("TEST_DATA_ROOT");
  const sku = {
    id: "test-sku",
    slug: "test-sku",
    title: "Test SKU",
    price: 100,
    deposit: 50,
    forSale: true,
    forRental: true,
    image: "",
    sizes: [] as string[],
    description: "",
  };
  const login = () => cy.loginAsAdmin();

  before(() => {
    cy.session("admin-session", login);
  });

  beforeEach(() => {
    // reuse checkout interception from checkout-flow.spec
    cy.intercept("POST", "**/api/checkout-session", {
      statusCode: 200,
      body: { clientSecret: "cs_test", sessionId: "sess_test" },
    }).as("createSession");

    cy.intercept("POST", "https://api.stripe.com/**", {
      statusCode: 200,
      body: {},
    }).as("confirmPayment");

    cy.session("admin-session", login);
  });

  it("records refunded rental order", () => {
    // 1️⃣ create rental cart
    cy.request("POST", "/api/cart", { sku: { id: sku.id }, qty: 1 });

    // 2️⃣ checkout
    cy.visit("/en/checkout");
    cy.wait("@createSession");
    cy.contains("button", "Pay").click();
    cy.wait("@confirmPayment");
    cy.location("pathname").should("eq", "/en/success");

    // 3️⃣ record rental and return
    cy.request("POST", "/api/rental", { sessionId: "sess_test" });
    cy.request("POST", "/api/return", { sessionId: "sess_test", damageFee: 0 });

    // 4️⃣ verify file contains refunded order
    cy.readFile(`${dataDir}/${shopId}/rental_orders.json`).then((orders) => {
      expect(orders).to.have.length(1);
      expect(orders[0].sessionId).to.equal("sess_test");
      expect(orders[0].refundedAt).to.be.a("string");
    });
  });
});
