import React from 'react';
import { MarketingOverviewHero } from './MarketingOverviewHero';

describe('MarketingOverviewHero (CT)', () => {
  it('renders heading and supporting text', () => {
    cy.mount(<MarketingOverviewHero />);
    cy.findByRole('heading', { name: /Marketing workspace/i }).should('be.visible');
    cy.findByText(/Launch campaigns, manage incentives/i).should('exist');
  });
});

