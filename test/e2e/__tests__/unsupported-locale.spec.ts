// test/e2e/unsupported-locale.spec.ts

// Ensure visiting an unsupported locale falls back to English

describe("Unsupported locale", () => {
  it("redirects or serves English without console errors", () => {
    cy.on("window:before:load", (win) => {
      cy.stub(win.console, "error").as("consoleError");
    });

    cy.visit("/fr");

    // Should end up on the English version (either / or /en)
    cy.location("pathname", { timeout: 10000 }).should((pathname) => {
      expect(/^\/(en)?(\/|$)/.test(pathname)).to.be.true;
    });

    // Verify no console errors were logged
    cy.get("@consoleError").should("not.be.called");
  });
});
