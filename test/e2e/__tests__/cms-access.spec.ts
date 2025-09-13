// test/e2e/cms-access.spec.ts

describe("CMS access control", () => {
  it("redirects unauthenticated users to login", () => {
    cy.visit("/cms/pages");
    cy.location("pathname").should("eq", "/login");
  });

  it("allows viewer read-only access but blocks writes", () => {
    cy.request("/api/auth/csrf").then(({ body }) => {
      cy.request({
        method: "POST",
        url: "/api/auth/callback/credentials",
        form: true,
        followRedirect: true,
        body: {
          csrfToken: body.csrfToken,
          email: "viewer@example.com",
          password: "viewer",
          callbackUrl: "/cms/pages",
        },
      });
    });

    cy.visit("/cms/pages");
    cy.contains("Choose a shop").should("be.visible");

    cy.visit("/cms/shop/abc/settings");
    cy.contains("403 – Access denied").should("be.visible");
  });

  it("allows admin access to write routes", () => {
    cy.request("/api/auth/csrf").then(({ body }) => {
      cy.request({
        method: "POST",
        url: "/api/auth/callback/credentials",
        form: true,
        followRedirect: true,
        body: {
          csrfToken: body.csrfToken,
          email: "admin@example.com",
          password: "admin",
          callbackUrl: "/cms/shop/abc/settings",
        },
      });
    });

    cy.visit("/cms/shop/abc/settings");
    cy.contains("Settings – abc").should("be.visible");
    cy.contains("403 – Access denied").should("not.exist");
  });
});
