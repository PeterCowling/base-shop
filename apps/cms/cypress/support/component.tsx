// Cypress Component Testing support for React components
// - Adds testing-library commands
// - Registers a global `cy.mount` command

import '@testing-library/cypress/add-commands';
import 'cypress-axe';
import '@cypress/grep';
import '@cypress/code-coverage/support';
import { mount as cypressMount } from 'cypress/react';
import React from 'react';
import { ThemeProvider } from '@acme/platform-core/contexts/ThemeContext';
import { LayoutProvider } from '@acme/platform-core/contexts/LayoutContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './component-globals.css';
import axeSource from 'axe-core/axe.min.js?raw';
import { TranslationsProvider } from '@acme/i18n';
import type { Messages } from '@acme/i18n/Translations';
// Router stub provider is exported from our Vite alias for 'next/navigation'
 
import type { RouterStubState } from '~test/shims/next-navigation-ct';
 
import { RouterStubProvider } from '~test/shims/next-navigation-ct';

type CypressMountOptions = Parameters<typeof cypressMount>[1];

type RouterOptions = {
  router?: Partial<RouterStubState> & { pathname?: string; search?: string | URLSearchParams };
  messages?: Messages;
};

type RouterLocaleOptions = RouterOptions & {
  locale?: string;
};

type RouterRouteParamOptions = RouterLocaleOptions & {
  params?: Record<string, string>;
};

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
      /** Simulate pressing the Tab key (minimal CT-friendly polyfill). */
      tab: (options?: { shift?: boolean }) => Chainable<JQuery<HTMLElement>>;
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

function buildRouterState(router?: RouterOptions['router'], paramOverrides?: Record<string, string>): RouterStubState {
  const pathname = router?.pathname ?? '/';
  const search = router?.search ?? '';
  const url = new URL(pathname + (typeof search === 'string' ? search : `?${search.toString()}`), 'http://localhost');
  const searchParams = new URLSearchParams(url.search);
  return {
    pathname,
    searchParams,
    params: paramOverrides ?? router?.params ?? {},
    push: router?.push ?? (() => {}),
    replace: router?.replace ?? (() => {}),
    back: router?.back ?? (() => {}),
    refresh: router?.refresh ?? (() => {}),
    prefetch: router?.prefetch ?? (async () => {}),
  };
}

Cypress.Commands.overwrite('injectAxe', () => {
  cy.window({ log: false }).then((win) => {
    if (win.axe) return;
    const script = win.document.createElement('script');
    script.id = '__axe-script';
    script.type = 'text/javascript';
    script.innerHTML = axeSource;
    win.document.head.appendChild(script);
  });
});

Cypress.Commands.add('mount', (component, options?: CypressMountOptions) => {
  return cypressMount(<Providers>{component}</Providers>, options);
});

Cypress.Commands.add('mountWithRouter', (component, options: RouterOptions & CypressMountOptions = {}) => {
  const { router, messages, ...mountOpts } = options;
  const routerState = buildRouterState(router);
  const msgs: Messages = messages ?? {};

  return cypressMount(
    <TranslationsProvider messages={msgs}>
      <RouterStubProvider value={routerState}>
        <Providers>{component}</Providers>
      </RouterStubProvider>
    </TranslationsProvider>,
    mountOpts
  );
});

Cypress.Commands.add('mountWithRouterLocale', (component, options: RouterLocaleOptions & CypressMountOptions = {}) => {
  const { router, messages, locale = 'en', ...mountOpts } = options;
  try { document.documentElement.setAttribute('lang', String(locale)); } catch {}

  const routerState = buildRouterState(router);
  const msgs: Messages = messages ?? {};

  return cypressMount(
    <TranslationsProvider messages={msgs}>
      <RouterStubProvider value={routerState}>
        <Providers>{component}</Providers>
      </RouterStubProvider>
    </TranslationsProvider>,
    mountOpts
  );
});

Cypress.Commands.add('mountWithRouterRouteParams', (component, options: RouterRouteParamOptions & CypressMountOptions = {}) => {
  const { router, params = {}, messages, locale = 'en', ...mountOpts } = options;
  try { document.documentElement.setAttribute('lang', String(locale)); } catch {}

  const routerState = buildRouterState(router, params);
  const msgs: Messages = messages ?? {};

  return cypressMount(
    <TranslationsProvider messages={msgs}>
      <RouterStubProvider value={routerState}>
        <Providers>{component}</Providers>
      </RouterStubProvider>
    </TranslationsProvider>,
    mountOpts
  );
});

const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(doc: Document) {
  const nodes = Array.from(doc.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return nodes.filter((el) => {
    const style = doc.defaultView?.getComputedStyle(el);
    if (!style) return false;
    const hasSize = el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
    return style.visibility !== 'hidden' && style.display !== 'none' && hasSize;
  });
}

Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject, options: { shift?: boolean } = {}) => {
  const shift = Boolean(options.shift);
  return cy.wrap(null, { log: false }).then(() => {
    const doc = (cy.state('document') || window.document) as Document;
    const focusables = getFocusableElements(doc);
    if (!focusables.length) return;
    const start = (subject?.[0] as HTMLElement) || (doc.activeElement as HTMLElement) || focusables[0];
    const currentIndex = Math.max(focusables.indexOf(start), 0);
    const delta = shift ? -1 : 1;
    const nextIndex = (currentIndex + delta + focusables.length) % focusables.length;
    const next = focusables[nextIndex] ?? start;
    const eventInit: KeyboardEventInit = { key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, shiftKey: shift };
    start.dispatchEvent(new KeyboardEvent('keydown', eventInit));
    next.focus();
    next.dispatchEvent(new KeyboardEvent('keyup', eventInit));
    return cy.wrap(next);
  });
});

export {};
