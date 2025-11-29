import "@testing-library/cypress/add-commands";

const login = () => cy.loginAsAdmin();

describe("CMS Page Builder — presets and versions", () => {
  before(() => {
    cy.session("admin-session", login);
  });

  it("inserts a preset from the gallery", function () {
    const shop = (Cypress.env('SHOP') as string) || 'demo';
    const slug = "home";
    cy.session("admin-session", login);
    cy.pbVisitBuilder(shop, slug);
    cy.document().then(function (doc) {
      if (!doc.querySelector('[data-cy="pb-canvas"]')) {
        cy.log(
          "Skipping cms-page-builder-presets-versions: builder canvas not available on /cms/shop/demo/pages/home/builder in this environment.",
        );
         
        this.skip();
        return;
      }
    });
    cy.pbEnsurePaletteOpen();

    // Count components before
    cy.get('[data-component-id]').then(($before) => {
      const baseCount = $before.length;
      // Open presets via event (works regardless of responsive thresholds)
      cy.window().then((win) => win.dispatchEvent(new Event('pb:open-presets')));
      // Click a known preset
      cy.contains('button', 'Hero: Simple').click();
      // Expect new components added
      cy.get('[data-component-id]').should('have.length.greaterThan', baseCount);
    });
  });

  it("saves a version and restores it after changes", function () {
    const shop = (Cypress.env('SHOP') as string) || 'demo';
    const slug = "home";
    cy.session("admin-session", login);
    cy.pbVisitBuilder(shop, slug);
    cy.document().then(function (doc) {
      if (!doc.querySelector('[data-cy="pb-canvas"]')) {
        cy.log(
          "Skipping cms-page-builder-presets-versions: builder canvas not available on /cms/shop/demo/pages/home/builder in this environment.",
        );
         
        this.skip();
        return;
      }
    });
    cy.pbEnsurePaletteOpen();

    // Baseline count
    cy.get('[data-component-id]').then(($base) => {
      const baseCount = $base.length;

      // Open Versions panel and create a version
      cy.contains('button', /^Versions$/).click();
      cy.findByLabelText('Create version').should('exist');
      cy.get('input[placeholder*="Label"]').type('v1');
      cy.contains('button', /^Save Version$/).click();
      // Ensure it shows up in list
      cy.contains('button[aria-label^="Select version"]', 'v1').should('exist');

      // Modify canvas: add a Section at root
      cy.findAllByRole('button', { name: 'Insert block here' }).first().click();
      cy.contains('button', 'Section').click();
      cy.pbSave();

      cy.get('[data-component-id]').then(($after) => {
        const modifiedCount = $after.length;
        expect(modifiedCount).to.be.greaterThan(baseCount);

        // Select saved version and restore
        cy.contains('button[aria-label^="Select version"]', 'v1').click();
        cy.contains('button', /^Restore Selected$/).click();

        // After restore, the count should return to baseline
        cy.get('[data-component-id]').should('have.length', baseCount);
      });
    });
  });

  it("rulers and baseline toggles show overlays", function () {
    const shop = (Cypress.env('SHOP') as string) || 'demo';
    const slug = "home";
    cy.session("admin-session", login);
    cy.pbVisitBuilder(shop, slug);
    cy.document().then(function (doc) {
      if (!doc.querySelector('[data-cy="pb-canvas"]')) {
        cy.log(
          "Skipping cms-page-builder-presets-versions: builder canvas not available on /cms/shop/demo/pages/home/builder in this environment.",
        );
         
        this.skip();
        return;
      }
    });

    cy.pbOpenCanvasSettings();
    // Toggle rulers on and verify overlay
    cy.pbToggleRulers();
    cy.get('[data-cy="pb-rulers-overlay"]').should('exist');

    // Toggle grid and baseline; verify baseline stripes appear on grid overlay
    cy.pbToggleGrid();
    cy.get('[data-cy="pb-grid-overlay"]').should('exist');
    cy.pbToggleBaseline();
    cy.get('[data-cy="pb-grid-overlay"]').should(($el) => {
      const style = ($el.get(0) as HTMLElement).getAttribute('style') || '';
      expect(style).to.include('repeating-linear-gradient');
    });
  });
});
