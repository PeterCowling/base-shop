import React, { useState } from 'react';
import { useParams } from 'next/navigation';

import ShopProvidersSection from '../sections/ShopProvidersSection';
import ShopSeoSection from '../sections/ShopSeoSection';

function Composite() {
  const { shop } = useParams<{ shop: string }>();
  const providers = [
    { id: 'ups', name: 'UPS' },
    { id: 'dhl', name: 'DHL' },
  ] as const;
  const [tracking, setTracking] = useState<string[]>(['ups']);
  const [filters, setFilters] = useState<string[]>(['size']);
  return (
    <div>
      <h2 data-cy="shop">{shop}</h2>
      <ShopProvidersSection
        trackingProviders={tracking}
        shippingProviders={providers as any}
        onTrackingChange={setTracking}
      />
      <ShopSeoSection catalogFilters={filters} onCatalogFiltersChange={setFilters} />
      <div data-cy="state" style={{ display: 'none' }}>{JSON.stringify({ tracking, filters })}</div>
    </div>
  );
}

describe('Settings composite (CT)', { tags: ['forms'] }, () => {
  it('syncs state across providers and SEO sections', () => {
    cy.mountWithRouterRouteParams(<Composite />, { params: { shop: 'demo' } });
    cy.get('[data-cy="shop"]').should('have.text', 'demo');

    // Toggle DHL on -> reflected in hidden state
    cy.findByLabelText('DHL').click();
    cy.get('[data-cy="state"]').should(($el) => {
      const state = JSON.parse($el.text());
      expect(state.tracking).to.include('dhl');
    });

    // Update SEO catalog filters input -> reflected in hidden state
    cy.findByLabelText('Catalog filters').clear().type('color, material');
    cy.get('[data-cy="state"]').should(($el) => {
      const state = JSON.parse($el.text());
      expect(state.filters).to.deep.equal(['color', 'material']);
    });
  });
});

