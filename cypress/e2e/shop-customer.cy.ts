describe("Shop customer login", () => {
  it("shows an error for invalid credentials", () => {
    cy.visit("/login");
    cy.get('input[name="customerId"]').type("cust1");
    cy.get('input[name="password"]').type("pass1pass");
    cy.contains("button", "Login").click();
    cy.contains("Invalid credentials");
  });
});
