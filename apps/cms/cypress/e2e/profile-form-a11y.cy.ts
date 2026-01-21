import '@testing-library/cypress/add-commands';

import React from 'react';
import ReactDOM from 'react-dom/client';

import ProfileForm from '../../../../packages/ui/src/components/account/ProfileForm';

describe('ProfileForm accessibility', { tags: ['a11y'] }, () => {
  it('focuses first invalid field and announces errors', () => {
    cy.visit('about:blank').then((win) => {
      ReactDOM.createRoot(win.document.body).render(
        React.createElement(ProfileForm)
      );
    });

    cy.injectAxe();

    cy.findByRole('button', { name: /save/i }).click();

    cy.focused().should('have.attr', 'id', 'name');
    cy.findByText('Name is required.').should('have.attr', 'role', 'alert');
    cy.findByText('Email is required.').should('have.attr', 'role', 'alert');
    cy.findByLabelText('Name').should('have.attr', 'aria-invalid', 'true');
    cy.findByLabelText('Email').should('have.attr', 'aria-invalid', 'true');

    cy.checkA11y(undefined, undefined, undefined, true);
  });
});
