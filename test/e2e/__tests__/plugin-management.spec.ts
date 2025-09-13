// test/e2e/plugin-management.spec.ts

describe("Plugin management", () => {
  beforeEach(() => {
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
          callbackUrl: "/cms/plugins",
        },
      });
    });
  });

  it("installs, enables and removes a plugin", () => {
    cy.intercept("GET", "/cms/api/plugins", {
      statusCode: 200,
      body: { plugins: [] },
    }).as("listPlugins");
    cy.intercept("POST", "/cms/api/plugins/install", {
      statusCode: 200,
      body: { id: "demo", name: "Demo" },
    }).as("installPlugin");
    cy.intercept("PATCH", "/cms/api/plugins/demo", {
      statusCode: 200,
      body: { enabled: true },
    }).as("enablePlugin");
    cy.intercept("DELETE", "/cms/api/plugins/demo", {
      statusCode: 200,
    }).as("removePlugin");

    cy.visit("/cms/plugins");
    cy.wait("@listPlugins");

    cy.contains("button", "Install plugin").click();
    cy.wait("@installPlugin");

    cy.get('input[type="checkbox"]').check({ force: true });
    cy.wait("@enablePlugin");

    cy.contains("button", "Remove").click();
    cy.wait("@removePlugin");
  });
});

