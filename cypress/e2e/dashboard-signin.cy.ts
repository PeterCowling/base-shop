describe("Dashboard sign in", () => {
  it("logs in via the login page and redirects", () => {
    const callbackUrl = "/cms";
    cy.visit(`/login?callbackUrl=${callbackUrl}`);
    cy.get('input[name="email"]').type("admin@example.com");
    cy.get('input[name="password"]').type("admin");
    cy.contains("button", "Continue").click();
    cy.location("pathname", { timeout: 10000 }).should("eq", callbackUrl);
  });
});
