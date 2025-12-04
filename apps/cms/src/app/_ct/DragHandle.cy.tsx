import React from 'react';
import { DragHandle } from '@acme/page-builder-ui';

describe('DragHandle (CT)', { tags: ['inspectors'] }, () => {
  it('renders with listeners when unlocked and calls onPointerDown', () => {
    const onPointerDown = cy.stub().as('down');
    const listeners = { 'data-listener': '1' } as any;
    cy.mount(
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <DragHandle attributes={{ 'data-attr': 'x' }} listeners={listeners} isDragging={false} locked={false} onPointerDown={onPointerDown} />
      </div>
    );
    cy.get('[role="button"]').should('have.attr', 'data-attr', 'x').and('have.attr', 'data-listener', '1');
    cy.get('[role="button"]').trigger('pointerdown');
    cy.get('@down').should('have.been.called');
  });

  it('does not spread listeners when locked', () => {
    const listeners = { 'data-listener': '1' } as any;
    cy.mount(
      <DragHandle attributes={{}} listeners={listeners} isDragging={false} locked={true} onPointerDown={() => {}} />
    );
    cy.get('[role="button"]').should('not.have.attr', 'data-listener');
  });
});
