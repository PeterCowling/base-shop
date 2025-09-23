import "@testing-library/cypress/add-commands";

// Simple credentials login (reused across specs)
const login = () => {
  cy.request("/api/auth/csrf").then(({ body }) => {
    const csrf = body.csrfToken as string;
    cy.request({
      method: "POST",
      url: "/api/auth/callback/credentials",
      form: true,
      followRedirect: true,
      body: {
        csrfToken: csrf,
        email: "admin@example.com",
        password: "admin",
        callbackUrl: "/",
      },
    });
  });
};

function getFirstPageId(shop: string): Cypress.Chainable<string> {
  const root = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  return cy.readFile(`${root}/${shop}/pages.json`, { log: false }).then((pages: any[]) => {
    const firstWithId = pages?.find((p) => typeof p?.id === "string" && p.id.length > 0);
    if (!firstWithId) throw new Error(`No pages with id found under ${root}/${shop}/pages.json`);
    return firstWithId.id as string;
  });
}

describe("CMS Page Builder — drag & drop", () => {
  before(() => {
    cy.session("admin-session", login);
  });

  it("drags Section to canvas, then Button into the Section", () => {
    const shop = (Cypress.env('SHOP') as string) || 'demo';
    const slug = "home";
    cy.session("admin-session", login);
    cy.pbVisitBuilder(shop, slug);
    cy.pbEnsurePaletteOpen();

      // Count containers before
      cy.get('[data-cy="pb-container"]').then(($before) => {
        const beforeContainers = $before.length;

        // Drag Section from palette to canvas (ROOT only allows containers)
        cy.pbDragPaletteToCanvas("Section");

        // Containers should increase
        cy.get('[data-cy="pb-container"]').should("have.length.greaterThan", beforeContainers);
      });

      // Drag a content block into the first container
      cy.get('[data-cy="pb-container"]').first().within(() => {
        cy.get('[data-component-id]').then(($beforeChildren) => {
          const before = $beforeChildren.length;
          cy.root().as("firstContainer");
          cy.pbDragPaletteToContainer("Button", 0);
          cy.get("@firstContainer").find('[data-component-id]').should("have.length.greaterThan", before);
        });
      });
  });

  it("disallowed drop: Button at ROOT (canvas) shows blocked state and no insert", () => {
    const shop = (Cypress.env('SHOP') as string) || 'demo';
    const slug = "home";
    cy.session("admin-session", login);
    cy.pbVisitBuilder(shop, slug);
    cy.pbEnsurePaletteOpen();

    cy.get('[data-component-id]').then(($before) => {
      const beforeCount = $before.length;
      cy.pbDragPaletteToCanvas('Button');
      // Count should not increase
      cy.get('[data-component-id]').should('have.length', beforeCount);
    });
  });

  it("grid snap: drag absolute block snaps to grid units", () => {
    const shop = (Cypress.env('SHOP') as string) || 'demo';
    const slug = "home";
    cy.session("admin-session", login);
    cy.pbVisitBuilder(shop, slug);
    cy.pbEnsurePaletteOpen();

    // Ensure a Section exists
    cy.get('[data-cy="pb-container"]').then(($containers) => {
      const had = $containers.length;
      if (had === 0) {
        cy.pbDragPaletteToCanvas('Section');
        cy.get('[data-cy="pb-container"]').should('have.length.greaterThan', had);
      }
    });

    // Add AnnouncementBar (absolute-positioned by default) into first container
    cy.pbDragPaletteToContainer('AnnouncementBar', 0);
    // Open Canvas settings and enable grid + snap and set 12 cols
    cy.pbOpenCanvasSettings();
    cy.pbToggleGrid();
    // Ensure overlay present
    cy.get('[data-cy="pb-grid-overlay"]').should('exist');
    // Set grid cols to 12 if possible
    cy.pbSetGridCols(12);

    // Drag the last inserted item a bit and assert left aligns to unit multiple
    cy.get('[data-component-id]').last().within(() => {
      cy.get('[title="Drag or press space/enter to move"]').then(($handle) => {
        // compute ~7.3 units based on container width read later
        cy.window().then((win) => {
          const host = $handle.parent().get(0) as HTMLElement;
          const parent = (host.parentElement as HTMLElement) || win.document.body;
          const unit = parent.offsetWidth / 12;
          cy.pbDragHandle($handle as any, unit * 7.3, unit * 0.4);
        });
      });
    });
    cy.get('[data-component-id]').last().then(($el) => {
      cy.window().then((win) => {
        const parent = ($el.get(0)!.parentElement as HTMLElement) || win.document.body;
        const unit = parent.offsetWidth / 12;
        const leftPx = parseFloat(($el.get(0) as HTMLElement).style.left || '0');
        const remainder = Math.abs((leftPx % unit));
        expect(remainder < 2 || Math.abs(remainder - unit) < 2).to.be.true;
      });
    });
  });

  it("axis lock (Shift): movement locks to dominant axis", () => {
    const shop = (Cypress.env('SHOP') as string) || 'demo';
    const slug = "home";
    cy.session("admin-session", login);
    cy.pbVisitBuilder(shop, slug);
    cy.pbEnsurePaletteOpen();
    // Ensure Section exists; add AnnouncementBar and enable grid
    cy.get('[data-cy="pb-container"]').then(($c) => { if ($c.length === 0) cy.pbDragPaletteToCanvas('Section'); });
    cy.pbDragPaletteToContainer('AnnouncementBar', 0);
    cy.pbOpenCanvasSettings();
    cy.pbToggleGrid();
    cy.pbSetGridCols(12);

    cy.get('[data-component-id]').last().then(($el) => {
      const initialTop = parseFloat(($el.get(0) as HTMLElement).style.top || '0');
      cy.wrap($el).within(() => {
        cy.get('[title="Drag or press space/enter to move"]').then(($handle) => {
          cy.window().then((win) => {
            const host = $handle.parent().get(0) as HTMLElement;
            const parent = (host.parentElement as HTMLElement) || win.document.body;
            const unit = parent.offsetWidth / 12;
            // Move mostly along X with Shift pressed; Y delta is non-zero but should be ignored
            cy.pbDragHandle($handle as any, unit * 5, unit * 1, { shift: true });
          });
        });
      });
      cy.window().then(() => {
        const finalTop = parseFloat(($el.get(0) as HTMLElement).style.top || '0');
        expect(Math.abs(finalTop - initialTop)).to.be.lessThan(2);
      });
    });
  });

  it("disallowed drop into MultiColumn container (no Section as child)", () => {
    const shop = (Cypress.env('SHOP') as string) || 'demo';
    const slug = "home";
    cy.session("admin-session", login);
    cy.pbVisitBuilder(shop, slug);
    cy.pbEnsurePaletteOpen();
    // Ensure root Section exists
    cy.get('[data-cy="pb-container"]').then(($c) => { if ($c.length === 0) cy.pbDragPaletteToCanvas('Section'); });
    // Insert a MultiColumn container inside the first Section
    cy.pbDragPaletteToContainer('MultiColumn', 0);
    // Attempt to drop a Section into that MultiColumn (should be disallowed)
    cy.get('[data-cy="pb-container"]').eq(1).as('multi');
    cy.get('@multi').find('[data-component-id]').then(($before) => {
      const count = $before.length;
      cy.pbDragPaletteToContainer('Section', 1);
      cy.get('@multi').find('[data-component-id]').should('have.length', count);
    });
  });

  it("tabbed container accepts drops into its child slots", () => {
    const shop = (Cypress.env('SHOP') as string) || 'demo';
    const slug = "home";
    cy.session("admin-session", login);
    cy.pbVisitBuilder(shop, slug);
    cy.pbEnsurePaletteOpen();

    // Ensure a Section exists
    cy.get('[data-cy="pb-container"]').then(($containers) => {
      const had = $containers.length;
      if (had === 0) {
        cy.pbDragPaletteToCanvas('Section');
        cy.get('[data-cy="pb-container"]').should('have.length.greaterThan', had);
      }
    });

    // Insert Tabs/Accordion container
    cy.get('[data-cy="pb-container"]').then(($cBefore) => {
      const beforeContainers = $cBefore.length;
      cy.pbDragPaletteToContainer('TabsAccordionContainer', 0);
      cy.get('[data-cy="pb-container"]').should('have.length.greaterThan', beforeContainers);
    });
    // The new inner container should be the last one; drop a Button into it
    cy.get('[data-cy="pb-container"]').last().as('innerContainer');
    cy.get('@innerContainer').find('[data-component-id]').then(($before) => {
      const n = $before.length;
      cy.pbDragPaletteToContainer('Button', Cypress.$('[data-cy="pb-container"]').length - 1 as any);
      cy.get('@innerContainer').find('[data-component-id]').should('have.length.greaterThan', n);
    });
  });
});
