// test/e2e/rbac-restrictions.spec.ts

function loginWithRole(role: string, sessionId: string) {
  const login = () =>
    cy.task("auth:token", role).then((token: string) => {
      cy.clearCookie("next-auth.session-token");
      cy.setCookie("next-auth.session-token", token, { path: "/" });
      cy.setCookie("next-auth.callback-url", "/", { path: "/" });
    });
  cy.session(sessionId, login);
}

describe("RBAC restrictions", () => {
  const shopId = "bcd";

  it("blocks viewer from accessing settings", () => {
    const url = `/cms/shop/${shopId}/settings`;
    loginWithRole("viewer", "viewer-session");
    cy.visit(url);
    cy.contains("403").should("be.visible");
  });

  it("blocks catalog manager from theme editor", () => {
    const url = `/cms/shop/${shopId}/themes`;
    loginWithRole("CatalogManager", "catalog-manager-session");
    cy.visit(url);
    cy.contains("403").should("be.visible");
  });

  it("blocks theme editor from products page", () => {
    const url = `/cms/shop/${shopId}/products`;
    loginWithRole("ThemeEditor", "theme-editor-session");
    cy.visit(url);
    cy.contains("403").should("be.visible");
  });

  it("allows shop admin to access settings", () => {
    const url = `/cms/shop/${shopId}/settings`;
    loginWithRole("ShopAdmin", "shop-admin-session");
    cy.visit(url);
    cy.contains(`Settings \u2013 ${shopId}`).should("be.visible");
  });
});
