import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from "jest-axe";

import { TranslationsProvider } from '@acme/i18n';

import { Alert } from '../Alert';

describe('Alert i18n title', () => {
  it('renders string title as-is', () => {
    const { container } = render(
      <TranslationsProvider messages={{}}>
        <Alert title="Notice">Body</Alert>
      </TranslationsProvider>
    );
    expect(screen.getByText('Notice')).toBeInTheDocument();
  });

  it('renders key title via t()', () => {
    render(
      <TranslationsProvider messages={{ 'alert.title': 'Translated' }}>
        <Alert title={{ type: 'key', key: 'alert.title' }}>Body</Alert>
      </TranslationsProvider>
    );
    expect(screen.getByText('Translated')).toBeInTheDocument();
  });

  it('renders inline title for locale', () => {
    render(
      <TranslationsProvider messages={{}}>
        <Alert title={{ type: 'inline', value: { de: 'Hinweis' } }} locale="de">Body</Alert>
      </TranslationsProvider>
    );
    expect(screen.getByText('Hinweis')).toBeInTheDocument();
  });
});

