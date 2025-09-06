describe("Shop login", () => {
  it("logs in a customer and manages session", () => {
    cy.visit("/login");
    cy.get('input[name="customerId"]').type("cust1");
    cy.get('input[name="password"]').type("pass1");
    cy.contains("button", "Login").click();
    cy.getCookie("customer_session").should("exist");
    cy.visit("/account/profile");
    cy.location("pathname", { timeout: 10000 }).should("eq", "/account/profile");
    cy.visit("/logout");
    cy.location("pathname").should("eq", "/");
    cy.getCookie("customer_session").should("not.exist");
  });
});
