import React from 'react';
import TokenInspector from './TokenInspector';

describe('TokenInspector (CT)', { tags: ['inspectors'] }, () => {
  it('highlights token and calls onTokenSelect from popover', () => {
    const onTokenSelect = cy.stub().as('onTokenSelect');
    cy.mount(
      <TokenInspector inspectMode onTokenSelect={onTokenSelect}>
        <div>
          <span data-token="color.background">BG</span>
          <span data-token="color.foreground">FG</span>
        </div>
      </TokenInspector>
    );

    cy.findByText('BG').click();
    cy.findByRole('button', { name: /Jump to editor/i }).click();
    cy.get('@onTokenSelect').should('have.been.called');
  });
});
