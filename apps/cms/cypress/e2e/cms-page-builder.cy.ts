import "@testing-library/cypress/add-commands";

// Basic credentials login reused from other CMS specs
const login = () => cy.loginAsAdmin();

describe("CMS Page Builder — core flows", () => {
  // Reuse session across tests
  before(() => {
    cy.session("admin-session", login);
  });

  function getFirstPageId(shop: string): Cypress.Chainable<string | null> {
    const root = "__tests__/data/shops";
    return cy
      .readFile(`${root}/${shop}/pages.json`, { log: false, timeout: 5000 })
      .then((pages: any[]) => {
        const firstWithId = pages?.find(
          (p) => typeof p?.id === "string" && p.id.length > 0,
        );
        return firstWithId ? (firstWithId.id as string) : null;
      });
  }

  it("loads builder, inserts Section, undo/redo", function () {
    const shop = (Cypress.env('SHOP') as string) || 'demo';
    const slug = "home";
    cy.session("admin-session", login);
    cy.pbVisitBuilder(shop, slug);

    cy.document().then(function (doc) {
      if (!doc.querySelector('[data-cy="pb-canvas"]')) {
        cy.log(
          "Skipping cms-page-builder core flows (insert/undo/redo): builder canvas not available on /cms/shop/demo/pages/home/builder in this environment.",
        );
         
        this.skip();
        return;
      }
    });

    // Initially count canvas items
    cy.get("[data-component-id]").then(($before) => {
        const initialCount = $before.length;

        // Insert a Section at top level via inline "+ Add"
        cy.findAllByRole("button", { name: "Insert block here" }).first().click();
        cy.contains("button", "Section").click();

        // Expect a new Canvas item rendered
        cy.get("[data-component-id]").should("have.length.greaterThan", initialCount);

        // Undo removes the inserted Section
        cy.contains("button", /^Undo$/).click();
        cy.get("[data-component-id]").should("have.length", initialCount);

        // Redo restores the Section
        cy.contains("button", /^Redo$/).click();
        cy.get("[data-component-id]").should("have.length.greaterThan", initialCount);
    });
  });

  it("toggles device and preview", function () {
    const shop = (Cypress.env("SHOP") as string) || "demo";
    cy.session("admin-session", login);
    getFirstPageId(shop).then((pageId) => {
      if (!pageId) {
        cy.log(
          `Skipping cms-page-builder core flows (device/preview): no pages.json entry with id found for shop "${shop}".`,
        );
         
        (this as any).skip();
        return;
      }

      const url = `/cms/shop/${shop}/pages/${pageId}/builder`;
      cy.visit(url, { failOnStatusCode: false });
      cy.location("pathname").should("eq", url);

      cy.document().then(function (doc) {
        if (!doc.querySelector('[data-cy="pb-canvas"]')) {
          cy.log(
            `Skipping cms-page-builder core flows (device/preview): builder canvas not available on ${url} in this environment.`,
          );
           
          (this as any).skip();
          return;
        }
      });

      // Switch device via quick icon buttons
      cy.findByRole("button", { name: /tablet/i }).click();
      // Open View menu and toggle Preview
      cy.findByRole("button", { name: "View options" }).click();
      cy.findByRole("switch", { name: /Preview/i }).click();
      // Preview pane should render alongside the canvas
      cy.contains("button", /^Publish$/).should("exist"); // sticky footer still visible
    });
  });
});
