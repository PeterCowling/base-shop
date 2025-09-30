import "@testing-library/cypress/add-commands";

// Helper to sign a minimal JWT for next-auth using the configured test secret
function sign(role: string) {
  const SECRET = (Cypress.env("NEXTAUTH_SECRET") as string) || "test-nextauth-secret-32-chars-long-string!";
  return cy
    .exec(
      `node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({role:'${role}'},'${SECRET}'))"`
    )
    .its("stdout")
    .then((s) => s.trim());
}

describe("CMS RBAC – viewer restrictions on settings", () => {
  const shop = (Cypress.env('SHOP') as string) || 'demo';

  it("renders Admin tools as read-only message and hides Save controls", () => {
    // Set viewer session cookie without doing full credentials flow
    sign("viewer").then((token) => {
      cy.setCookie("next-auth.session-token", token);
    });

    cy.visit(`/cms/shop/${shop}/settings`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings`);

    // Admin tools shows viewer message
    cy.contains("You are signed in as a viewer. Editing is disabled.").should("exist");

    // No Save buttons rendered for editor forms
    cy.findAllByRole("button", { name: /^Save/ }).should("have.length", 0);
  });
});
