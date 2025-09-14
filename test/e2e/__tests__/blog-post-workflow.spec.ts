// test/e2e/blog-post-workflow.spec.ts

describe("Blog post workflow", () => {
  const shopId = "bcd";
  const baseUrl = `/cms/blog/posts?shopId=${shopId}`;

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
          callbackUrl: baseUrl,
        },
      });
    });
  });

  it("creates, edits, publishes, unpublishes and deletes a post", () => {
    cy.intercept("POST", "/cms/api/blog/posts", {
      statusCode: 200,
      body: { id: "1" },
    }).as("createPost");

    cy.visit(`/cms/blog/posts/new?shopId=${shopId}`);
    cy.get('input[name="title"]').type("My Post");
    cy.get('textarea[name="excerpt"]').type("Excerpt");
    cy.contains("button", "Save").click();
    cy.wait("@createPost");

    cy.intercept("POST", "/cms/api/blog/posts/1", { statusCode: 200 }).as(
      "editPost",
    );
    cy.visit(`/cms/blog/posts/1?shopId=${shopId}`);
    cy.get('input[name="title"]').clear().type("Updated Post");
    cy.contains("button", "Save").click();
    cy.wait("@editPost");

    cy.intercept("POST", "/cms/api/blog/posts/1/publish", { statusCode: 200 }).as(
      "publishPost",
    );
    cy.contains("button", "Publish").click();
    cy.wait("@publishPost");

    cy.intercept("POST", "/cms/api/blog/posts/1/unpublish", {
      statusCode: 200,
    }).as("unpublishPost");
    cy.contains("button", "Unpublish").click();
    cy.wait("@unpublishPost");

    cy.intercept("DELETE", "/cms/api/blog/posts/1", { statusCode: 200 }).as(
      "deletePost",
    );
    cy.contains("button", "Delete").click();
    cy.wait("@deletePost");
  });
});

