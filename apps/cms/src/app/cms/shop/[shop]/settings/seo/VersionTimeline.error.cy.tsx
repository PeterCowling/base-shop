import React from 'react';
import VersionTimeline from './VersionTimeline';

describe('VersionTimeline errors (CT)', { tags: ['inspectors'] }, () => {
  it('shows empty state when no history available', () => {
    // Set global history to empty via the stub store
    cy.window().then((win) => {
      (win as any).__versions_history = [];
    });
    cy.mount(<VersionTimeline shop="demo" trigger={<button>Open</button>} />);
    cy.contains('button', 'Open').click();
    cy.findByText('No history available.').should('exist');
  });

  it('handles fetch error on open by showing empty', () => {
    cy.window().then((win) => {
      (win as any).__versions_fail_on_fetch = true;
    });
    cy.mount(<VersionTimeline shop="demo" trigger={<button>Open</button>} />);
    cy.contains('button', 'Open').click();
    cy.findByText('No history available.').should('exist');
    cy.window().then((win) => { delete (win as any).__versions_fail_on_fetch; });
  });

  it('does not crash UI when revert fails (ignored via uncaught handler)', () => {
    // Ignore thrown error to observe UI behavior
    Cypress.on('uncaught:exception', () => false);
    cy.mount(<VersionTimeline shop="fail" trigger={<button>Open</button>} />);
    cy.contains('button', 'Open').click();
    cy.contains('button', 'Revert').first().click();
    // Drawer remains visible
    cy.findByText('Revision History').should('exist');
  });
});

