import React from 'react';
import VersionTimeline from './VersionTimeline';

describe('VersionTimeline (CT)', { tags: ['inspectors'] }, () => {
  it('opens drawer, shows history and reverts an entry', () => {
    cy.mount(<VersionTimeline shop="demo" trigger={<button>Open</button>} />);

    cy.contains('button', 'Open').click();
    cy.findByText('Revision History').should('exist');

    // Should show at least one Revert button
    cy.contains('button', 'Revert').should('exist');

    // Click first Revert should prune newer entries (stub behavior)
    cy.contains('button', 'Revert').first().click();
    // After revert, history refetches; still stable
    cy.findByText('Revision History').should('exist');
  });
});

