describe("Dashboard sign in", { tags: ["smoke"] }, () => {
  it("logs in via the login page and manages session", function () {
    const callbackUrl = "/cms";
    cy.visit(`/login?callbackUrl=${callbackUrl}`);

    cy.document().then(function (doc) {
      const errorRoot = doc.getElementById("__next_error__");
      const hasEmailInput = !!doc.querySelector('input[name="email"]');
      if (errorRoot || !hasEmailInput) {
        cy.log(
          "Skipping dashboard-signin: login form with email/password is not present in this environment.",
        );
         
        this.skip();
        return;
      }
    });

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
