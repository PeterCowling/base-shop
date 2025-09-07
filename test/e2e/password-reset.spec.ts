describe("Password reset flow", () => {
  const email = "admin@example.com";
  const originalPassword = "admin";
  const newPassword = "newpass123";

  it("resets password and allows login with new credentials", () => {
    cy.intercept("POST", "/api/password-reset/request").as("resetReq");
    cy.visit("/password-reset/request");
    cy.get('input[name="email"]').type(email);
    cy.contains("button", "Send reset link").click();
    cy.wait("@resetReq")
      .its("response.body.token")
      .then((token: string) => {
        expect(token).to.be.a("string");
        cy.visit(`/password-reset/${token}`);
        cy.get('input[name="password"]').type(newPassword);
        cy.contains("button", "Reset password").click();
        cy.contains("Password updated").should("be.visible");

        cy.visit("/login");
        cy.get('input[name="email"]').type(email);
        cy.get('input[name="password"]').type(newPassword);
        cy.contains("button", "Continue").click();
        cy.location("pathname").should("eq", "/cms");
        cy.contains("Sign out").click();
        cy.location("pathname").should("eq", "/login");
      })
      .then(() => {
        // restore original password so other tests remain unaffected
        return cy
          .request("POST", "/api/password-reset/request", { email })
          .its("body.token")
          .then((token: string) => {
            expect(token).to.be.a("string");
            return cy.request("POST", `/api/password-reset/${token}`, {
              password: originalPassword,
            });
          });
      });
  });

  it("shows error for expired token", () => {
    cy.request("POST", "/api/password-reset/request", { email })
      .its("body.token")
      .then((token: string) => {
        expect(token).to.be.a("string");
        cy.wait(1100);
        cy.visit(`/password-reset/${token}`);
        cy.get('input[name="password"]').type("anotherpass123");
        cy.contains("button", "Reset password").click();
        cy.contains(/invalid or expired/i).should("be.visible");
      });
  });

  it("shows error for invalid token", () => {
    cy.visit("/password-reset/invalid-token");
    cy.get('input[name="password"]').type("anotherpass123");
    cy.contains("button", "Reset password").click();
    cy.contains(/invalid or expired/i).should("be.visible");
  });
});
