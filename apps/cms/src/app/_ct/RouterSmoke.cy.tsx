import React from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

function RouterProbe() {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  return (
    <div>
      <div data-cy="pathname">{pathname}</div>
      <div data-cy="search">{search.toString()}</div>
      <button onClick={() => router.push('/next')}>Go</button>
    </div>
  );
}

describe('Router stub (CT)', { tags: ['basics'] }, () => {
  it('mounts with pathname + query via mountWithRouter', () => {
    const push = cy.stub().as('push');
    cy.mountWithRouter(<RouterProbe />, { router: { pathname: '/cms', search: '?q=test', push } });
    cy.get('[data-cy="pathname"]').should('have.text', '/cms');
    cy.get('[data-cy="search"]').should('have.text', 'q=test');
    cy.contains('button', 'Go').click();
    cy.get('@push').should('have.been.calledWith', '/next');
  });
});

