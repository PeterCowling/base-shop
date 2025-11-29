// Simple visual baseline for the CMS login page
describe.skip('Visual: Login page', { tags: ['visual', 'smoke'] }, () => {
  it('renders login page consistently', function () {
    cy.visit('/login', { failOnStatusCode: false });

    const hasSnapshot = typeof (cy as any).matchImageSnapshot === "function";
    if (!hasSnapshot) {
      cy.log(
        "Skipping visual-login: matchImageSnapshot is not configured in this environment.",
      );
       
      (this as any).skip();
      return;
    }

    cy.matchImageSnapshot('login-page');
  });
});
