import React from 'react';

import ServiceToggleField from './ServiceToggleField';

describe('ServiceToggleField (CT)', { tags: ['forms'] }, () => {
  it('renders label, description and switch; toggles on click', () => {
    const onChange = cy.stub().as('onChange');
    cy.mount(
      <ServiceToggleField
        id="svc"
        name="svc"
        label="Email notifications"
        description="Send customers updates via email"
        checked={false}
        onChange={onChange}
      />
    );

    cy.findByLabelText('Email notifications').as('toggle');
    cy.findByText('Send customers updates via email').should('exist');

    cy.get('@toggle').click();
    cy.get('@onChange').should('have.been.calledWith', true);

    cy.get('@toggle').click();
    cy.get('@onChange').should('have.been.calledWith', false);
  });
});
