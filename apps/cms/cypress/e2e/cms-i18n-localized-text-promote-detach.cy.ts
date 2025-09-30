import "@testing-library/cypress/add-commands";

describe("CMS editor – LocalizedTextInput Promote/Detach", () => {
  const shop = (Cypress.env("SHOP") as string) || "demo";
  const pageSlug = "home";

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("promotes inline EN text to shared key, then detaches back to inline", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.pbVisitBuilder(shop, pageSlug);
    cy.pbEnsurePaletteOpen();

    // Insert an AnnouncementBar block to get a simple LocalizedTextInput field
    cy.pbDragPaletteToCanvas("AnnouncementBar");

    // Select the last inserted component on the canvas
    cy.get("[data-component-id]").last().click();

    // Open Content tab in the sidebar
    cy.findByRole("button", { name: "Content" }).click();

    // In the LocalizedTextInput labeled "Text", type EN content
    const enValue = `Promo text ${Date.now()}`;
    cy.findByText(/^Text$/)
      .parentsUntil("body", ".space-y-2")
      .first()
      .within(() => {
        cy.get('input[placeholder="Text (EN)"]').clear().type(enValue);

        // Stub window.prompt for key input
        const key = "announcement.text";
        cy.window().then((win) => {
          cy.stub(win, "prompt").returns(key);
        });

        // Intercept promote API to simulate success
        cy.intercept("POST", "/cms/api/i18n/promote", {
          statusCode: 200,
          body: {},
        }).as("promote");

        // Click Promote → Key and wait for API
        cy.contains("button", "Promote → Key").click();
        cy.wait("@promote");

        // Now in shared key mode: search box prefilled with key, and Detach enabled
        cy.get('input[placeholder="Search EN keys"]').should("have.value", key);
        cy.contains("button", "Detach → Inline").should("not.be.disabled");

        // Intercept detach API to return inline values for locales
        cy.intercept("GET", "/cms/api/i18n/detach*", {
          statusCode: 200,
          body: {
            success: true,
            values: { en: enValue, de: `${enValue} DE` },
          },
        }).as("detach");

        // Detach back to inline
        cy.contains("button", "Detach → Inline").click();
        cy.wait("@detach");

        // Back in inline mode; EN input should have the detached value
        cy.get('input[placeholder="Text (EN)"]').should("have.value", enValue);
        // Promote CTA visible again
        cy.contains("Promote to shared key").should("exist");
      });
  });
});

