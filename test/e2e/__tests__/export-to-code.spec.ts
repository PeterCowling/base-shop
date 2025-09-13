// test/e2e/export-to-code.spec.ts

describe("Export to Code page", () => {
  const shopId = "abc";
  const pageId = "home";
  const exportUrl = `/cms/shop/${shopId}/pages/${pageId}/export`;

  it("shows export page", () => {
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
          callbackUrl: exportUrl,
        },
      });
    });

    cy.visit(exportUrl);
    cy.contains("Export to Code").should("exist");
  });
});
