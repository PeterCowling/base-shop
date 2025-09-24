import React from 'react';
import { useTranslations } from '@i18n';

function I18nProbe() {
  const t = useTranslations();
  return (
    <div>
      <div data-cy="lang">{document.documentElement.getAttribute('lang')}</div>
      <div data-cy="hello">{t('hello')}</div>
    </div>
  );
}

describe('Locale + i18n (CT)', { tags: ['basics'] }, () => {
  it('sets html[lang] and renders translations (EN only)', () => {
    cy.mountWithRouterLocale(<I18nProbe />, { locale: 'en', messages: { hello: 'Hello' } });
    cy.get('[data-cy="lang"]').should('have.text', 'en');
    cy.get('[data-cy="hello"]').should('have.text', 'Hello');
  });
});
