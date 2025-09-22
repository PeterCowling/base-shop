import React from 'react';
import ShopProvidersSection from './ShopProvidersSection';

const providers = [
  { id: 'ups', name: 'UPS' },
  { id: 'dhl', name: 'DHL' },
] as const;

describe('ShopProvidersSection (CT)', { tags: ['forms'] }, () => {
  it('toggles tracking providers and shows error', () => {
    const onTrackingChange = cy.stub().as('onTrackingChange');
    cy.mount(
      <ShopProvidersSection
        trackingProviders={['ups']}
        shippingProviders={providers as any}
        onTrackingChange={onTrackingChange}
        errors={{ trackingProviders: ['Select at least one'] }}
      />
    );

    // Error is visible and checkboxes are described by it
    cy.findByText('Select at least one').should('exist');
    cy.findAllByRole('checkbox').each(($el) => {
      cy.wrap($el).should('have.attr', 'aria-describedby', 'tracking-providers-error');
    });

    // Toggle DHL on
    cy.findByLabelText('DHL').click();
    cy.get('@onTrackingChange').should('have.been.calledWith', ['ups', 'dhl']);

    // Toggle UPS off
    cy.findByLabelText('UPS').click();
    cy.get('@onTrackingChange').should('have.been.calledWith', ['dhl']);
  });
});

