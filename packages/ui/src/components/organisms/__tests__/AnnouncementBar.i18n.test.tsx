import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AnnouncementBar from '../../organisms/AnnouncementBar';
import { TranslationsProvider } from '@acme/i18n';

describe('AnnouncementBar i18n', () => {
  it('renders legacy string', () => {
    render(
      <TranslationsProvider messages={{ 'announcementBar.close': 'Close announcement' }}>
        <AnnouncementBar text="Promo" closable />
      </TranslationsProvider>
    );
    expect(screen.getByText('Promo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close announcement' })).toBeInTheDocument();
  });

  it('renders key ref', () => {
    render(
      <TranslationsProvider messages={{ greet: 'Hello', 'announcementBar.close': 'Close announcement' }}>
        <AnnouncementBar text={{ type: 'key', key: 'greet' }} closable />
      </TranslationsProvider>
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders inline per-locale', () => {
    render(
      <TranslationsProvider messages={{ 'announcementBar.close': 'Close announcement' }}>
        <AnnouncementBar
          text={{ type: 'inline', value: { en: 'Hello', de: 'Hallo' } }}
          locale="de"
          closable
        />
      </TranslationsProvider>
    );
    expect(screen.getByText('Hallo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close announcement' }));
    expect(screen.queryByText('Hallo')).not.toBeInTheDocument();
  });
});

