import React from 'react';
import { useParams } from 'next/navigation';

function ParamsProbe() {
  const params = useParams<{ shop: string; pageId?: string }>();
  return (
    <div>
      <div data-cy="shop">{params.shop}</div>
      <div data-cy="pageId">{params.pageId ?? ''}</div>
    </div>
  );
}

describe('Router params stub (CT)', { tags: ['basics'] }, () => {
  it('provides dynamic route params via mountWithRouterRouteParams', () => {
    cy.mountWithRouterRouteParams(<ParamsProbe />, { params: { shop: 'demo', pageId: 'home' } });
    cy.get('[data-cy="shop"]').should('have.text', 'demo');
    cy.get('[data-cy="pageId"]').should('have.text', 'home');
  });
});

