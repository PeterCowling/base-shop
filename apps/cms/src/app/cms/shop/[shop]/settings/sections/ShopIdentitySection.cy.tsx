import React from 'react';

import type { Shop } from '@acme/types';

import ShopIdentitySection from './ShopIdentitySection';

function makeShop(overrides: Partial<Shop> = {}): Shop {
  return {
    id: 'demo',
    slug: 'demo',
    name: 'Maison',
    themeId: 'base',
    languages: ['en'],
    seo: {},
    currency: 'EUR',
    taxRegion: '',
    updatedAt: '',
    updatedBy: '',
    luxuryFeatures: {
      blog: false,
      contentMerchandising: false,
      raTicketing: false,
      requireStrongCustomerAuth: false,
      strictReturnConditions: false,
      trackingDashboard: false,
      premierDelivery: false,
      fraudReviewThreshold: 0,
      ...((overrides as any).luxuryFeatures || {}),
    },
    ...(overrides as Omit<Shop, 'luxuryFeatures'>),
  } as Shop;
}

describe('ShopIdentitySection (CT)', () => {
  it('renders inputs and toggles features; propagates changes', () => {
    const info = makeShop();
    const onInfoChange = cy.stub().as('onInfoChange');
    const onLuxuryFeatureChange = cy.stub().as('onLuxuryFeatureChange');

    cy.mount(
      <ShopIdentitySection
        info={info}
        onInfoChange={onInfoChange}
        onLuxuryFeatureChange={onLuxuryFeatureChange}
      />
    );

    // Change shop name and theme preset
    cy.findByLabelText('Shop name').clear().type('Maison Deluxe');
    cy.get('@onInfoChange').should('have.been.calledWith', 'name', 'Maison Deluxe');

    cy.findByLabelText('Theme preset').clear().type('bcd-classic');
    cy.get('@onInfoChange').should('have.been.calledWith', 'themeId', 'bcd-classic');

    // Toggle a luxury feature
    cy.findByLabelText('Enable blog').click();
    cy.get('@onLuxuryFeatureChange').should('have.been.calledWith', 'blog', true);

    // Update fraud threshold
    cy.findByLabelText('Fraud review threshold').clear().type('5');
    cy.get('@onLuxuryFeatureChange').should('have.been.calledWith', 'fraudReviewThreshold', 5);
  });

  it('reflects aria-invalid and describedby when errors provided', () => {
    const info = makeShop();
    const errors = {
      name: ['Required'],
      themeId: ['Invalid theme'],
      fraudReviewThreshold: ['Must be >= 0'],
    } as const;

    cy.mount(
      <ShopIdentitySection
        info={info}
        errors={errors}
        onInfoChange={() => {}}
        onLuxuryFeatureChange={() => {}}
      />
    );

    cy.findByLabelText('Shop name')
      .should('have.attr', 'aria-invalid', 'true')
      .and('have.attr', 'aria-describedby', 'shop-name-error');
    cy.findByText('Required').should('exist');

    cy.findByLabelText('Theme preset')
      .should('have.attr', 'aria-invalid', 'true')
      .and('have.attr', 'aria-describedby', 'shop-theme-error');

    cy.findByLabelText('Fraud review threshold')
      .should('have.attr', 'aria-invalid', 'true')
      .and('have.attr', 'aria-describedby', 'luxury-fraud-error');
  });
});

