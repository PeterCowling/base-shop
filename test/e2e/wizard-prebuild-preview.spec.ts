// test/e2e/wizard-prebuild-preview.spec.ts

describe("Pre-scaffold wizard", () => {
  const shopId = "abc";
  const url = `/cms/shop/${shopId}/wizard/new`;

  it("allows preview before creation", () => {
    cy.request("/api/auth/csrf").then(({ body }) => {
      const csrf = body.csrfToken;
      cy.request({
        method: "POST",
        url: "/api/auth/callback/credentials",
        form: true,
        followRedirect: true,
        body: {
          csrfToken: csrf,
          email: "admin@example.com",
          password: "admin",
          callbackUrl: url,
        },
      });
    });

    cy.visit(url);
    cy.get('input[placeholder="intro,features"]').type("intro");
    cy.get('input[placeholder="Welcome"]').type("Hello");
    cy.get('input[placeholder="Start"]').type("Go");
    cy.contains("button", "Next").click();
    cy.contains("Hello").should("be.visible");
    cy.contains("button", "Create").click();
    cy.location("pathname").should("include", "/pages/");
    cy.location("pathname").should("include", "/builder");
  });
});
