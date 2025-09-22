import React from 'react';
import SizeControls from '@ui/components/cms/page-builder/panels/layout/SizeControls';

describe('SizeControls (CT)', { tags: ['inspectors'] }, () => {
  it('emits handleResize and handleFullSize for desktop width', () => {
    const handleResize = cy.stub().as('resize');
    const handleFullSize = cy.stub().as('full');
    const component = { id: 'comp1', type: 'Box' } as any;

    cy.mount(
      <div style={{ width: 1000 }}>
        <div data-component-id="comp1" />
        <SizeControls component={component} locked={false} handleResize={handleResize as any} handleFullSize={handleFullSize as any} />
      </div>
    );

    // Type into Width (Desktop)
    cy.findByLabelText(/^Width \(Desktop\)/).clear().type('200px');
    cy.get('@resize').should('have.been.calledWith', 'widthDesktop', '200px');

    // Click Full width (Desktop)
    cy.contains('button', 'Full width').first().click();
    cy.get('@full').should('have.been.calledWith', 'widthDesktop');

    // Change unit to %; expect emitted value with % unit
    cy.findAllByRole('combobox').first().click();
    cy.get('[role="option"]').contains('%').click();
    cy.get('@resize').its('lastCall.args.1').should('match', /%$/);
  });
});

