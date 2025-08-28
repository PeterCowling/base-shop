// test/e2e/image-swap-url.spec.ts

describe("Remote image probe API", () => {
  it("validates image content type", () => {
    cy.request("HEAD", "/cms/api/media/probe?url=https://httpbin.org/image/png")
      .its("status")
      .should("eq", 200);
    cy.request({
      method: "HEAD",
      url: "/cms/api/media/probe?url=https://httpbin.org/html",
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 415);
  });
});
