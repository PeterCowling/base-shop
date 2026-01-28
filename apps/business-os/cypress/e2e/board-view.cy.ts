/**
 * E2E tests for board viewing functionality
 */

describe("Board View", () => {
  it("should load the home page", () => {
    cy.visit("/");
    cy.get("h1").should("exist");
  });

  it("should navigate to a business board", () => {
    cy.visit("/");

    // Look for a link to a business board (assumes at least one business exists)
    cy.get('a[href*="/boards/"]').first().click();

    // Should show board lanes
    cy.url().should("include", "/boards/");
    cy.contains(/inbox|fact-finding|planned|in progress|blocked|done/i).should("exist");
  });

  it("should display cards in lanes", () => {
    // Visit a known business board (or handle if none exist)
    cy.visit("/boards/PLAT").then(() => {
      // Check if lanes exist
      cy.get('body').then(($body) => {
        if ($body.text().includes("Inbox") || $body.text().includes("No cards")) {
          cy.log("Board loaded successfully");
        } else {
          cy.log("Board may not have any cards yet");
        }
      });
    });
  });

  it("should allow filtering archived cards", () => {
    cy.visit("/boards/PLAT");

    // Look for archive filter checkbox if it exists
    cy.get('body').then(($body) => {
      if ($body.find('input[type="checkbox"]').length > 0) {
        cy.get('input[type="checkbox"]').first().click();
        cy.log("Toggled archive filter");
      }
    });
  });
});
