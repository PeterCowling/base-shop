describe("Dashboard sign in", { tags: ["smoke"] }, () => {
  it("logs in via the login page and manages session", () => {
    const callbackUrl = "/cms";
    cy.visit(`/login?callbackUrl=${callbackUrl}`);
    cy.get('input[name="email"]').type("admin@example.com");
    cy.get('input[name="password"]').type("admin");
    cy.contains("button", "Continue").click();
    cy.location("pathname", { timeout: 10000 }).should("eq", callbackUrl);
    cy.getCookie("customer_session").should("exist");
    cy.visit("/logout");
    cy.getCookie("customer_session").should("not.exist");
    cy.location("pathname").should("eq", "/login");
  });
});
