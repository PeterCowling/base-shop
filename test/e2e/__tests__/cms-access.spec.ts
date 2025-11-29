// test/e2e/cms-access.spec.ts

function loginWithRole(role: string) {
  return cy.task("auth:token", role).then((token: string) => {
    cy.clearCookie("next-auth.session-token");
    cy.setCookie("next-auth.session-token", token, { path: "/" });
    cy.setCookie("next-auth.callback-url", "/", { path: "/" });
  });
}

describe("CMS access control", () => {
  it("redirects unauthenticated users to login", () => {
    cy.visit("/cms/pages");
    cy.location("pathname").should("eq", "/login");
  });

  it("allows viewer read-only access but blocks writes", () => {
    const login = () => loginWithRole("viewer");
    cy.session("viewer-session", login);

    cy.visit("/cms/pages");
    cy.contains("Choose a shop").should("be.visible");

    cy.visit("/cms/shop/bcd/settings");
    cy.contains("403 – Access denied").should("be.visible");
  });

  it("allows admin access to write routes", () => {
    const login = () => loginWithRole("admin");
    cy.session("admin-session", login);

    cy.visit("/cms/shop/bcd/settings");
    cy.contains("Settings – bcd").should("be.visible");
    cy.contains("403 – Access denied").should("not.exist");
  });
});
