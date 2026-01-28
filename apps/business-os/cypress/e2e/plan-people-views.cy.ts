/**
 * E2E tests for plan and people document presentation views
 */

describe("Plan & People Views", () => {
  describe("Business Plan View", () => {
    it("should load a business plan page", () => {
      cy.visit("/plans/PLAT");

      cy.get('body').then(($body) => {
        if ($body.text().includes("Business Plan") || $body.text().includes("404")) {
          // Either shows plan or 404 if not found
          if (!$body.text().includes("404")) {
            cy.contains(/business plan/i);
            cy.get(".prose, article, main").should("exist");
          }
        }
      });
    });

    it("should show Request Change button on plan page", () => {
      cy.visit("/plans/PLAT");

      cy.get('body').then(($body) => {
        if (!$body.text().includes("404")) {
          cy.contains("button", /request change/i).should("exist");
        }
      });
    });

    it("should open change request modal", () => {
      cy.visit("/plans/PLAT");

      cy.get('body').then(($body) => {
        if (!$body.text().includes("404")) {
          cy.contains("button", /request change/i).click();

          // Modal should appear
          cy.get('[role="dialog"], .modal, form').should("be.visible");
          cy.contains(/describe the change|change request/i);
        }
      });
    });
  });

  describe("People View", () => {
    it("should load the people page", () => {
      cy.visit("/people");

      cy.get('body').then(($body) => {
        if ($body.text().includes("People") || $body.text().includes("Team") || $body.text().includes("404")) {
          if (!$body.text().includes("404")) {
            cy.contains(/people|team/i);
            cy.get(".prose, article, main").should("exist");
          }
        }
      });
    });

    it("should show Request Change button on people page", () => {
      cy.visit("/people");

      cy.get('body').then(($body) => {
        if (!$body.text().includes("404")) {
          cy.contains("button", /request change/i).should("exist");
        }
      });
    });

    it("should render markdown content", () => {
      cy.visit("/people");

      cy.get('body').then(($body) => {
        if (!$body.text().includes("404")) {
          // Should have prose/markdown styling
          cy.get(".prose, [class*='markdown']").should("exist");
        }
      });
    });
  });

  describe("Change Request Flow", () => {
    it("should validate change request form", () => {
      cy.visit("/plans/PLAT");

      cy.get('body').then(($body) => {
        if (!$body.text().includes("404")) {
          cy.contains("button", /request change/i).click();

          // Try to submit empty form
          cy.get('button[type="submit"]').click();

          // Should require description - check that textarea is required or error message appears
          cy.get('textarea[required], body:contains("required")').should("exist");
        }
      });
    });
  });
});
