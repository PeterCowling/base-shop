// test/e2e/login.spec.ts

// Verify login flow for valid and invalid credentials

describe("Login flow", () => {
  it("redirects to /cms on successful login", () => {
    cy.visit("/login");
    cy.get('input[name="email"]').type("admin@example.com");
    cy.get('input[name="password"]').type("admin");
    cy.contains("button", "Continue").click();
    cy.location("pathname").should("eq", "/cms");

    // sign out so next test starts unauthenticated
    cy.contains("Sign out").click();
    cy.location("pathname").should("eq", "/login");
  });

  it("shows error on invalid credentials without redirect", () => {
    cy.visit("/login");
    cy.get('input[name="email"]').type("admin@example.com");
    cy.get('input[name="password"]').type("wrong");
    cy.contains("button", "Continue").click();
    cy.location("pathname").should("eq", "/login");
    cy.contains("Invalid email or password").should("be.visible");
  });
});
