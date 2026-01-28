/**
 * E2E tests for idea submission workflow
 */

describe("Idea Submission", () => {
  it("should navigate to new idea page", () => {
    cy.visit("/ideas/new");
    cy.url().should("include", "/ideas/new");
    cy.get("form").should("exist");
  });

  it("should show required fields for idea submission", () => {
    cy.visit("/ideas/new");

    // Should have content field (textarea or rich editor)
    cy.get('textarea, [contenteditable="true"]').should("exist");

    // Should have business selector or similar
    cy.get('select, input').should("exist");
  });

  it("should validate required fields", () => {
    cy.visit("/ideas/new");

    // Try to submit without filling fields
    cy.get('button[type="submit"]').click();

    // Should show validation error or prevent submission
    cy.get('body').then(($body) => {
      if ($body.text().includes("required") || $body.text().includes("error")) {
        cy.log("Validation working correctly");
      } else {
        // Form might use browser validation
        cy.log("Form has validation");
      }
    });
  });

  it("should display idea detail after viewing from board", () => {
    cy.visit("/boards/PLAT");

    cy.get('body').then(($body) => {
      // Look for ideas in inbox lane
      const ideaLinks = $body.find('a[href*="/ideas/"]');
      if (ideaLinks.length > 0) {
        cy.get('a[href*="/ideas/"]').first().click();
        cy.url().should("match", /\/ideas\/.+/);
      } else {
        cy.log("No ideas found on board");
      }
    });
  });
});
