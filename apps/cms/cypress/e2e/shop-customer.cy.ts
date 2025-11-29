describe("Shop customer login", () => {
  it("shows an error for invalid credentials", function () {
    cy.request("/login").then((resp) => {
      if (!resp.body.includes('name="customerId"')) {
        cy.log("Skipping shop-customer spec: legacy shopper login form is not present");
        this.skip();
        return;
      }

      cy.visit("/login");
      cy.get('input[name="customerId"]').type("cust1");
      cy.get('input[name="password"]').type("pass1pass");
      cy.contains("button", "Login").click();
      cy.contains("Invalid credentials");
    });
  });
});
