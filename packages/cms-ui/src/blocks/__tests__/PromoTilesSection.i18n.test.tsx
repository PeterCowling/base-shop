import React from 'react';
import { render, screen } from '@testing-library/react';

import { TranslationsProvider } from '@acme/i18n';

import PromoTilesSection from '../PromoTilesSection';

describe('PromoTilesSection i18n', () => {
  it('resolves caption and cta via inline values per-locale', () => {
    render(
      <TranslationsProvider messages={{}}>
        <PromoTilesSection
          tiles={[
            {
              imageSrc: '/a.jpg',
              caption: { type: 'inline', value: { en: 'New In', de: 'Neu' } },
              ctaLabel: { type: 'inline', value: { en: 'Shop', de: 'Kaufen' } },
              ctaHref: '#',
            },
          ]}
          locale="de"
        />
      </TranslationsProvider>
    );
    expect(screen.getByText('Neu')).toBeInTheDocument();
    expect(screen.getByText('Kaufen')).toBeInTheDocument();
  });
});

