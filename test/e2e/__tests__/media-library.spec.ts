// test/e2e/media-library.spec.ts

describe("Media library", () => {
  const shopId = "bcd";

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
          callbackUrl: `/cms/shop/${shopId}/media`,
        },
      });
    });
  });

  it("uploads, renames and deletes a file", () => {
    cy.visit(`/cms/shop/${shopId}/media`);

    cy.intercept("POST", `/cms/api/media?shop=${shopId}`, {
      statusCode: 200,
      body: { url: `/uploads/${shopId}/test.txt` },
    }).as("uploadFile");

    cy.get('input[type="file"]').selectFile({
      contents: "hello world",
      fileName: "test.txt",
    });
    cy.wait("@uploadFile");

    cy.intercept("POST", `/cms/api/media?shop=${shopId}`, {
      statusCode: 200,
      body: { url: `/uploads/${shopId}/test.txt`, altText: "renamed" },
    }).as("renameFile");
    cy.contains("Edit").click();
    cy.get('input[placeholder="Alt text"]').clear().type("renamed");
    cy.contains("button", "Save").click();
    cy.wait("@renameFile");

    cy.intercept("DELETE", `/cms/api/media?shop=${shopId}&file=*`).as(
      "deleteFile",
    );
    cy.contains("Delete").click();
    cy.wait("@deleteFile");
  });
});

