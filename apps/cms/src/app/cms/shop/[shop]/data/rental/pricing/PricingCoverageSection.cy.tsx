import React from 'react';
import PricingCoverageSection from './PricingCoverageSection';

const rows = [
  { code: 'basic', enabled: false, fee: '0.00', waiver: '0.00' },
  { code: 'premium', enabled: true, fee: '1.99', waiver: '99.00' },
] as const;

describe('PricingCoverageSection (CT)', { tags: ['forms'] }, () => {
  it('toggles coverage and validates numeric inputs', () => {
    const onUpdate = cy.stub().as('onUpdate');
    const getErrors = (code: string) => (code === 'basic' ? { fee: '', waiver: '' } : { fee: '', waiver: '' });

    cy.mount(<PricingCoverageSection rows={rows as any} onUpdate={onUpdate} getErrors={getErrors as any} />);

    // Toggle basic coverage on
    cy.findByLabelText('Offer coverage').first().click();
    cy.get('@onUpdate').should('have.been.calledWith', 'basic', { enabled: true });

    // Change premium fee
    cy.findByLabelText('Coverage fee').eq(1).clear().type('2.49');
    cy.get('@onUpdate').should('have.been.calledWith', 'premium', { fee: '2.49' });
  });
});

