import React from 'react';
import { render, screen } from '@testing-library/react';
import Bind from '../../containers/Bind';
import { TranslationsProvider } from '@acme/i18n';

jest.mock('../../data/DataContext', () => ({
  useCurrentItem: () => ({
    item: {
      title: { type: 'inline', value: { en: 'Hello', de: 'Hallo' } },
    },
  }),
  useDatasetMeta: () => ({}),
}));

function Child({ text }: { text?: string | Record<string, unknown> }) {
  return (
    <div data-testid="text" data-cy="text">
      {typeof text === 'string' ? text : 'object'}
    </div>
  );
}

describe('Bind (i18n resolution)', () => {
  it('injects resolved inline text for locale', () => {
    render(
      <TranslationsProvider messages={{}}>
        <Bind path="title" locale="de">
          <Child />
        </Bind>
      </TranslationsProvider>
    );
    expect(screen.getByTestId('text').textContent).toBe('Hallo');
  });

  it('passes raw value when raw=true', () => {
    render(
      <TranslationsProvider messages={{}}>
        <Bind path="title" raw locale="de">
          <Child />
        </Bind>
      </TranslationsProvider>
    );
    expect(screen.getByTestId('text').textContent).toBe('object');
  });
});
