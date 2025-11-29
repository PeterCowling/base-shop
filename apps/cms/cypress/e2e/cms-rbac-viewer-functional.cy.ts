import "@testing-library/cypress/add-commands";

describe("CMS RBAC – viewer restrictions on settings", () => {
  const shop = (Cypress.env("SHOP") as string) || "demo";

  const loginAsViewer = () =>
    cy.task("auth:token", "viewer").then((token: string) => {
      cy.clearCookie("next-auth.session-token");
      cy.setCookie("next-auth.session-token", token, { path: "/" });
      cy.setCookie("next-auth.callback-url", "/", { path: "/" });
    });

  it("redirects viewer to 403 access denied for settings", () => {
    cy.session("viewer-session", loginAsViewer);

    cy.visit(`/cms/shop/${shop}/settings`, { failOnStatusCode: false });

    // Access denied screen is shown instead of settings editor
    cy.contains("403 – Access denied").should("exist");
    cy.contains("You don’t have permission to perform this action.").should(
      "exist",
    );

    // No Save buttons rendered for settings editor
    cy.findAllByRole("button", { name: /^Save/ }).should("have.length", 0);
  });
});
