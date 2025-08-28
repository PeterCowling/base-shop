// test/e2e/image-swap-url.spec.ts

describe("Image swap via URL", () => {
  const shopId = "abc";
  const builderUrl = `/cms/shop/${shopId}/pages/home/builder`;

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
          callbackUrl: builderUrl,
        },
      });
    });
  });

  it("probes remote image and sets alt text", () => {
    const imageUrl = "https://example.com/test.png";
    cy.intercept(
      "HEAD",
      `/cms/api/media/probe?url=${encodeURIComponent(imageUrl)}`,
      {
        statusCode: 200,
        headers: { "content-type": "image/png" },
      }
    ).as("probe");

    cy.visit(builderUrl);
    cy.get('input[placeholder="Image URL"]').type(imageUrl).blur();
    cy.wait("@probe");
    cy.get('input[placeholder="Alt text"]').type("sample");
  });
});
