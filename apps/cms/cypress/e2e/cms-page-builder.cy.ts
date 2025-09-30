import "@testing-library/cypress/add-commands";

// Basic credentials login reused from other CMS specs
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

describe("CMS Page Builder — core flows", () => {
  // Reuse session across tests
  before(() => {
    cy.session("admin-session", login);
  });

  function getFirstPageId(shop: string): Cypress.Chainable<string> {
    const root = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
    return cy.readFile(`${root}/${shop}/pages.json`, { log: false }).then((pages: any[]) => {
      const firstWithId = pages?.find((p) => typeof p?.id === "string" && p.id.length > 0);
      if (!firstWithId) throw new Error(`No pages with id found under ${root}/${shop}/pages.json`);
      return firstWithId.id as string;
    });
  }

  it("loads builder, inserts Section, undo/redo", () => {
    const shop = (Cypress.env('SHOP') as string) || 'demo';
    const slug = "home";
    cy.session("admin-session", login);
    cy.pbVisitBuilder(shop, slug);

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

  it("toggles device and preview", () => {
    const shop = (Cypress.env('SHOP_ALT') as string) || (Cypress.env('SHOP') as string) || 'bcd';
    cy.session("admin-session", login);
    getFirstPageId(shop).then((pageId) => {
      const url = `/cms/shop/${shop}/pages/${pageId}/builder`;
      cy.visit(url, { failOnStatusCode: false });
      cy.location("pathname").should("eq", url);

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
