// test/e2e/export-to-code.spec.ts

describe("Export to Code page", () => {
  const shopId = "cover-me-pretty";
  const pageId = "home";
  const exportUrl = `/cms/shop/${shopId}/pages/${pageId}/export`;
  const login = () => cy.loginAsAdmin();

  before(() => {
    cy.session("admin-session", login);
  });

  it("shows export page", () => {
    cy.session("admin-session", login);

    cy.visit(exportUrl);
    cy.contains("Export to Code").should("exist");
  });
});
