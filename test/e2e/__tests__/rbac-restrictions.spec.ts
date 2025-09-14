// test/e2e/rbac-restrictions.spec.ts

describe("RBAC restrictions", () => {
  const shopId = "bcd";

  function signIn(email: string, password: string, callbackUrl: string) {
    cy.request("/api/auth/csrf").then(({ body }) => {
      cy.request({
        method: "POST",
        url: "/api/auth/callback/credentials",
        form: true,
        followRedirect: true,
        body: {
          csrfToken: body.csrfToken,
          email,
          password,
          callbackUrl,
        },
      });
    });
  }

  it("blocks viewer from accessing settings", () => {
    const url = `/cms/shop/${shopId}/settings`;
    signIn("viewer@example.com", "viewer", url);
    cy.visit(url);
    cy.contains("403").should("be.visible");
  });

  it("blocks catalog manager from theme editor", () => {
    const url = `/cms/shop/${shopId}/themes`;
    signIn("catalogmanager@example.com", "catalogmanager", url);
    cy.visit(url);
    cy.contains("403").should("be.visible");
  });

  it("blocks theme editor from products page", () => {
    const url = `/cms/shop/${shopId}/products`;
    signIn("themeeditor@example.com", "themeeditor", url);
    cy.visit(url);
    cy.contains("403").should("be.visible");
  });

  it("allows shop admin to access settings", () => {
    const url = `/cms/shop/${shopId}/settings`;
    signIn("shopadmin@example.com", "shopadmin", url);
    cy.visit(url);
    cy.contains("Settings – ${shopId}").should("be.visible");
  });
});

