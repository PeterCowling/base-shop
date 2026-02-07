import React from 'react';
import { useParams } from 'next/navigation';

import SettingsHero from './SettingsHero';

function Wrapper() {
  const { shop } = useParams<{ shop: string }>();
  const snapshotItems = [
    { label: 'Languages', value: 'en' },
    { label: 'Currency', value: 'EUR' },
  ];
  return <SettingsHero shop={shop} isAdmin={false} snapshotItems={snapshotItems as any} />;
}

describe('SettingsHero via route params (CT)', { tags: ['basics'] }, () => {
  it('renders shop id from params', () => {
    cy.mountWithRouterRouteParams(<Wrapper />, { params: { shop: 'demo' } });
    cy.findByRole('heading', { name: /Keep demo running smoothly/i }).should('exist');
  });
});

