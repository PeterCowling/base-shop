// Simple visual baseline for the CMS login page
describe('Visual: Login page', { tags: ['visual', 'smoke'] }, () => {
  it('renders login page consistently', () => {
    cy.visit('/login', { failOnStatusCode: false });
    cy.matchImageSnapshot('login-page');
  });
});

