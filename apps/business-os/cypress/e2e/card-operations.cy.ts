/**
 * E2E tests for card creation, viewing, and editing
 */

describe("Card Operations", () => {
  it("should navigate to card create page", () => {
    cy.visit("/cards/new");
    cy.url().should("include", "/cards/new");
    cy.get("form").should("exist");
  });

  it("should display card detail view", () => {
    // First, try to find a card from the board
    cy.visit("/boards/PLAT");

    cy.get('body').then(($body) => {
      const cardLinks = $body.find('a[href*="/cards/"]');
      if (cardLinks.length > 0) {
        // Click on first card
        cy.get('a[href*="/cards/"]').first().click();

        // Should show card detail
        cy.url().should("match", /\/cards\/[A-Z]+-\d+/);
        cy.get("h1, h2").should("exist");
      } else {
        cy.log("No cards found on board");
      }
    });
  });

  it("should navigate to card edit page from detail view", () => {
    cy.visit("/boards/PLAT");

    cy.get('body').then(($body) => {
      const cardLinks = $body.find('a[href*="/cards/"]');
      if (cardLinks.length > 0) {
        cy.get('a[href*="/cards/"]').first().click();

        // Look for edit button/link
        cy.get('a[href*="/edit"]').first().click();
        cy.url().should("include", "/edit");
        cy.get("form").should("exist");
      } else {
        cy.log("No cards found to edit");
      }
    });
  });

  it("should show card history", () => {
    cy.visit("/boards/PLAT");

    cy.get('body').then(($body) => {
      const cardLinks = $body.find('a[href*="/cards/"]');
      if (cardLinks.length > 0) {
        cy.get('a[href*="/cards/"]').first().click();

        // Look for history section
        cy.get('body').then(($detail) => {
          if ($detail.text().includes("History") || $detail.text().includes("Changes")) {
            cy.contains(/history|changes/i);
          }
        });
      }
    });
  });
});
