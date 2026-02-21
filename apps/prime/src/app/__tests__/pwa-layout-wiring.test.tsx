import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import RootLayout, { metadata } from '../layout';

jest.mock('next/font/google', () => ({
  Plus_Jakarta_Sans: () => ({ className: 'font-sans', variable: '--font-plus-jakarta-sans' }),
}));

jest.mock('../../components/pwa/ServiceWorkerProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="sw-provider">{children}</div>
  ),
}));

jest.mock('../../providers/QueryProvider', () => ({
  QueryProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="query-provider">{children}</div>
  ),
}));

jest.mock('../providers', () => ({
  Providers: ({ children }: { children: ReactNode }) => (
    <div data-testid="app-providers">{children}</div>
  ),
}));

describe('Root layout PWA wiring', () => {
  it('TC-02: exports manifest metadata for app-shell discovery', () => {
    expect(metadata.manifest).toBe('/manifest.webmanifest');
  });

  it('wraps app content with query and service worker providers', () => {
    const html = renderToStaticMarkup(
      RootLayout({
        children: <main data-testid="child-shell">shell</main>,
      }),
    );

    expect(html).toContain('data-testid="query-provider"');
    expect(html).toContain('data-testid="sw-provider"');
    expect(html).toContain('data-testid="child-shell"');
  });
});
