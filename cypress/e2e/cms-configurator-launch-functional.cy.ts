import "@testing-library/cypress/add-commands";

describe("CMS – Configurator launch (SSE stub)", () => {
  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("enables Launch and streams step completions", () => {
    // Mark all required steps complete so Launch becomes enabled
    const completed: Record<string, string> = {
      "shop-details": "complete",
      theme: "complete",
      tokens: "complete",
      "payment-provider": "complete",
      shipping: "complete",
      "checkout-page": "complete",
      inventory: "complete",
      "env-vars": "complete",
      hosting: "complete",
    };

    cy.intercept('GET', '/api/configurator-progress', {
      statusCode: 200,
      body: { state: { shopId: 'demo' }, completed },
    }).as('getProgress');

    // Stub SSE stream for /api/launch-shop
    const sse = [
      { step: 'create', status: 'success' },
      { step: 'init', status: 'success' },
      { step: 'deploy', status: 'success' },
      { done: true },
    ];
    const body = sse.map((m) => `data: ${JSON.stringify(m)}\n\n`).join("");
    cy.intercept('POST', '/api/launch-shop', (req) => {
      req.reply({
        statusCode: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body,
      });
    }).as('launch');

    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit('/cms/configurator', { failOnStatusCode: false });
    cy.wait('@getProgress');

    // Launch button is enabled and tooltip indicates readiness
    cy.findByRole('button', { name: 'Launch shop' }).should('not.be.disabled').click();
    cy.wait('@launch');

    // Verify each step shows Complete in the launch progress panel
    cy.contains('Create shop').parent().within(() => {
      cy.contains('Complete');
    });
    cy.contains('Initialise workspace').parent().within(() => {
      cy.contains('Complete');
    });
    cy.contains('Deploy infrastructure').parent().within(() => {
      cy.contains('Complete');
    });
  });
});
