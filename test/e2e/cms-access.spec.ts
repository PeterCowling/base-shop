// test/e2e/cms-access.spec.ts

describe("CMS access control", () => {
  it("redirects unauthenticated users to login", () => {
    cy.visit("/cms/pages");
    cy.location("pathname").should("eq", "/login");
  });
});
