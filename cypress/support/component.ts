// Cypress Component Testing support for React components
// - Adds testing-library commands
// - Registers a global `cy.mount` command

import '@testing-library/cypress/add-commands';
import 'cypress-grep';
import { mount as cypressMount } from 'cypress/react';
import React from 'react';
import { ThemeProvider } from '@platform-core/contexts/ThemeContext';
import { LayoutProvider } from '@platform-core/contexts/LayoutContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@cms/app/globals.css';
import { TranslationsProvider } from '@i18n';
import type { Messages } from '@i18n/Translations';
// Router stub provider is exported from our Vite alias for 'next/navigation'
// eslint-disable-next-line import/no-duplicates
import type { RouterStubState } from '../../test/shims/next-navigation-ct';
// eslint-disable-next-line import/no-duplicates
import { RouterStubProvider } from '../../test/shims/next-navigation-ct';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Mount a React component for Component Testing with app providers */
      mount: typeof cypressMount;
      /** Mount with router + i18n stubs for components using next/navigation or translations */
      mountWithRouter: (
        component: React.ReactNode,
        options?: {
          router?: Partial<RouterStubState> & { pathname?: string; search?: string | URLSearchParams };
          messages?: Messages;
        } & Parameters<typeof cypressMount>[1]
      ) => ReturnType<typeof cypressMount>;
      /** Mount with router + i18n, and set document locale (html[lang]) */
      mountWithRouterLocale: (
        component: React.ReactNode,
        options?: {
          router?: Partial<RouterStubState> & { pathname?: string; search?: string | URLSearchParams };
          messages?: Messages;
          locale?: string;
        } & Parameters<typeof cypressMount>[1]
      ) => ReturnType<typeof cypressMount>;
      /** Mount and provide route params via useParams() */
      mountWithRouterRouteParams: (
        component: React.ReactNode,
        options?: {
          router?: Partial<RouterStubState> & { pathname?: string; search?: string | URLSearchParams };
          messages?: Messages;
          params?: Record<string, string>;
          locale?: string;
        } & Parameters<typeof cypressMount>[1]
      ) => ReturnType<typeof cypressMount>;
    }
  }
}

function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(() => new QueryClient());
  return (
    <ThemeProvider>
      <LayoutProvider>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </LayoutProvider>
    </ThemeProvider>
  );
}

Cypress.Commands.add('mount', (component, options) => {
  return cypressMount(<Providers>{component}</Providers>, options);
});

Cypress.Commands.add('mountWithRouter', (component, options = {}) => {
  const { router, messages, ...mountOpts } = options as any;
  const pathname = router?.pathname ?? '/';
  const search = router?.search ?? '';
  const url = new URL(pathname + (typeof search === 'string' ? search : `?${search.toString()}`), 'http://localhost');
  const searchParams = new URLSearchParams(url.search);
  const routerState: RouterStubState = {
    pathname,
    searchParams,
    params: router?.params ?? {},
    push: router?.push ?? (() => {}),
    replace: router?.replace ?? (() => {}),
    back: router?.back ?? (() => {}),
    refresh: router?.refresh ?? (() => {}),
    prefetch: router?.prefetch ?? (async () => {}),
  };

  const msgs: Messages = messages ?? {};

  return cypressMount(
    <TranslationsProvider messages={msgs}>
      <RouterStubProvider value={routerState}>
        <Providers>{component}</Providers>
      </RouterStubProvider>
    </TranslationsProvider>,
    mountOpts as any
  );
});

Cypress.Commands.add('mountWithRouterLocale', (component, options = {}) => {
  const { router, messages, locale = 'en', ...mountOpts } = options as any;
  try { document.documentElement.setAttribute('lang', String(locale)); } catch {}

  const pathname = router?.pathname ?? '/';
  const search = router?.search ?? '';
  const url = new URL(pathname + (typeof search === 'string' ? search : `?${search.toString()}`), 'http://localhost');
  const searchParams = new URLSearchParams(url.search);
  const routerState: RouterStubState = {
    pathname,
    searchParams,
    params: router?.params ?? {},
    push: router?.push ?? (() => {}),
    replace: router?.replace ?? (() => {}),
    back: router?.back ?? (() => {}),
    refresh: router?.refresh ?? (() => {}),
    prefetch: router?.prefetch ?? (async () => {}),
  };

  const msgs: Messages = messages ?? {};

  return cypressMount(
    <TranslationsProvider messages={msgs}>
      <RouterStubProvider value={routerState}>
        <Providers>{component}</Providers>
      </RouterStubProvider>
    </TranslationsProvider>,
    mountOpts as any
  );
});

Cypress.Commands.add('mountWithRouterRouteParams', (component, options = {}) => {
  const { router, params = {}, messages, locale = 'en', ...mountOpts } = options as any;
  try { document.documentElement.setAttribute('lang', String(locale)); } catch {}

  const pathname = router?.pathname ?? '/';
  const search = router?.search ?? '';
  const url = new URL(pathname + (typeof search === 'string' ? search : `?${search.toString()}`), 'http://localhost');
  const searchParams = new URLSearchParams(url.search);
  const routerState: RouterStubState = {
    pathname,
    searchParams,
    params,
    push: router?.push ?? (() => {}),
    replace: router?.replace ?? (() => {}),
    back: router?.back ?? (() => {}),
    refresh: router?.refresh ?? (() => {}),
    prefetch: router?.prefetch ?? (async () => {}),
  };

  const msgs: Messages = messages ?? {};

  return cypressMount(
    <TranslationsProvider messages={msgs}>
      <RouterStubProvider value={routerState}>
        <Providers>{component}</Providers>
      </RouterStubProvider>
    </TranslationsProvider>,
    mountOpts as any
  );
});

export {};
