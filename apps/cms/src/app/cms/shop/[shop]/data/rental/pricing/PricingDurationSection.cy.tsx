import React from 'react';
import PricingDurationSection from './PricingDurationSection';

const rows = [
  { id: 'tier1', minDays: '1', rate: '1.00' },
] as const;

describe('PricingDurationSection (CT)', { tags: ['forms'] }, () => {
  it('adds and removes tiers and validates fields', () => {
    const onAdd = cy.stub().as('onAdd');
    const onRemove = cy.stub().as('onRemove');
    const onUpdate = cy.stub().as('onUpdate');
    const getErrors = (_id: string) => ({ minDays: '', rate: '' });

    cy.mount(
      <PricingDurationSection
        rows={rows as any}
        onAdd={onAdd}
        onRemove={(id) => onRemove(id)}
        onUpdate={(id, u) => onUpdate(id, u)}
        getErrors={getErrors as any}
      />
    );

    cy.contains('button', 'Add discount tier').click();
    cy.get('@onAdd').should('have.been.called');

    cy.findByLabelText('Min days').clear().type('3');
    cy.get('@onUpdate').should('have.been.calledWith', 'tier1', { minDays: '3' });

    cy.findByLabelText('Rate multiplier').clear().type('0.85');
    cy.get('@onUpdate').should('have.been.calledWith', 'tier1', { rate: '0.85' });

    cy.contains('button', 'Remove').click();
    cy.get('@onRemove').should('have.been.calledWith', 'tier1');
  });
});

