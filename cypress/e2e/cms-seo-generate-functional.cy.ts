import "@testing-library/cypress/add-commands";

describe("CMS settings – SEO generate with AI (stubbed)", () => {
  const shop = "demo";
  const root = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  const settingsFile = `${root}/${shop}/settings.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("updates fields from stubbed API and persists after save", () => {
    const generated = {
      title: "AI Title",
      description: "AI Description",
      alt: "AI Alt",
      image: "https://example.com/ai.jpg",
    };

    cy.intercept('POST', '/api/seo/generate', (req) => {
      req.reply(200, generated);
    }).as('aiGen');

    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings/seo`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings/seo`);

    // Trigger generation
    cy.findByRole('button', { name: 'Generate with AI' }).click();
    cy.wait('@aiGen');

    // Fields update
    cy.findByLabelText('Title').should('have.value', generated.title);
    cy.findByLabelText('Description').should('have.value', generated.description);

    // Save to persist to settings.json
    cy.findByRole('button', { name: /^Save$/ }).click();
    cy.contains(/Metadata saved/).should('exist');

    cy.readFile(settingsFile, { timeout: 5000 }).then((json: any) => {
      expect(json).to.have.nested.property('seo.en.title', generated.title);
      expect(json).to.have.nested.property('seo.en.description', generated.description);
    });
  });
});

