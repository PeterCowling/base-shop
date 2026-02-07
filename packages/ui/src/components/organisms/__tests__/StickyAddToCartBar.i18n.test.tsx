import React from 'react';
import { render, screen } from '@testing-library/react';

import { TranslationsProvider } from '@acme/i18n';
import { CurrencyProvider } from '@acme/platform-core/contexts/CurrencyContext';

import { StickyAddToCartBar } from '../../organisms/StickyAddToCartBar';

const product = { id: 'sku1', title: 'Shoe', price: 100 } as any;

describe('StickyAddToCartBar i18n', () => {
  it('uses default key when no label provided', () => {
    render(
      <CurrencyProvider>
        <TranslationsProvider messages={{ 'actions.addToCart': 'Add to cart' }}>
          <StickyAddToCartBar product={product} onAddToCart={() => {}} />
        </TranslationsProvider>
      </CurrencyProvider>
    );
    expect(screen.getByText('Add to cart')).toBeInTheDocument();
  });

  it('resolves inline label per-locale', () => {
    render(
      <CurrencyProvider>
        <TranslationsProvider messages={{}}>
          <StickyAddToCartBar
            product={product}
            onAddToCart={() => {}}
            ctaLabel={{ type: 'inline', value: { en: 'Buy', de: 'Kaufen' } }}
            locale="de"
          />
        </TranslationsProvider>
      </CurrencyProvider>
    );
    expect(screen.getByText('Kaufen')).toBeInTheDocument();
  });
});
