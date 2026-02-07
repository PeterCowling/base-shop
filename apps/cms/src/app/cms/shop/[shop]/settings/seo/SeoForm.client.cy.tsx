import React from 'react';

import type { Locale } from '@acme/types';

import SeoForm from './SeoForm.client';

const languages = ['en'] as unknown as Locale[];

describe('SeoForm (CT)', { tags: ['forms'] }, () => {
  it('saves and shows warnings for long fields', () => {
    cy.mount(
      <SeoForm
        shop="demo"
        languages={languages}
        initialSeo={{ en: { title: '', description: '' } }}
        baseLocale={languages[0]}
      />
    );

    // Type long title and long description to trigger warnings
    const longTitle = 'T'.repeat(71);
    const longDesc = 'D'.repeat(161);
    cy.contains('Meta').parent().find('input').clear().type(longTitle);
    cy.contains('Meta').parent().find('textarea').first().clear().type(longDesc);

    cy.contains('button', 'Save').click();
    cy.findByText(/Title exceeds recommended length/).should('exist');
    cy.findByText(/Description exceeds recommended length/).should('exist');
  });

  it('shows validation errors when required fields missing', () => {
    cy.mount(
      <SeoForm
        shop="demo"
        languages={languages}
        initialSeo={{ en: { title: '', description: '' } }}
      />
    );

    // Ensure title empty, click save
    cy.contains('button', 'Save').click();
    cy.findByText('Required').should('exist');
  });
});
