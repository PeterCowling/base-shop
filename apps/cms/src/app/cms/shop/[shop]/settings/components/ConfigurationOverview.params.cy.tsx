import React from 'react';
import { useParams } from 'next/navigation';
import ConfigurationOverview from './ConfigurationOverview';

function Wrapper() {
  const { shop } = useParams<{ shop: string }>();
  const themeTokenRows = [
    { token: 'color.background', default: '#ffffff', override: '#fafafa' },
    { token: 'color.foreground', default: '#000000', override: null },
  ] as any;
  return (
    <ConfigurationOverview
      shop={shop}
      isAdmin
      languages={['en'] as any}
      catalogFilters={['size', 'color']}
      currency="EUR"
      taxRegion="EU"
      themePreset="base"
      themeTokenRows={themeTokenRows}
      filterMappings={{ color: 'product.color', size: 'product.size' }}
    />
  );
}

describe('ConfigurationOverview via route params (CT)', { tags: ['inspectors'] }, () => {
  it('renders overview and theme table, admin reset buttons present', () => {
    cy.mountWithRouterRouteParams(<Wrapper />, { params: { shop: 'demo' } });
    cy.findByRole('heading', { name: /Configuration overview/i }).should('exist');
    cy.findByText('EUR').should('exist');
    cy.findByText('EU').should('exist');
    cy.findAllByText('Reset').should('have.length.at.least', 1);
  });
});

