// Bring in dashboard styles so rendered text colors reflect the app
import '../styles/globals.css';

import React from 'react';

import { __setNextRouter } from '../../../../test/shims/next-router-ct';

import Upgrade from './Upgrade';

describe('Dashboard – Upgrade page (CT)', () => {
  it('renders, allows selection + publish, and has no color-contrast issues', () => {
    __setNextRouter({ query: { id: 'shop1' } });

    cy.window().then((win) => {
      // Stub fetch to return a simple component diff and OK publish
      const diff = {
        ok: true,
        json: async () => ({
          core: [
            { file: 'CompA.tsx', componentName: 'CompA', newChecksum: '1' },
            { file: 'CompB.tsx', componentName: 'CompB', newChecksum: '2' },
          ],
        }),
      } as Response;
      const publish = { ok: true, text: async () => '' } as Response;
      const original = win.fetch.bind(win);
      const stub = cy.stub().callsFake((url: RequestInfo | URL) => {
        const u = String(url);
        if (u.includes('/api/shop/shop1/component-diff')) return Promise.resolve(diff);
        if (u.includes('/api/shop/shop1/publish-upgrade')) return Promise.resolve(publish);
        // fallback to original if any other URL is requested
        return original(url);
      });
      // Replace window.fetch with our stub
      // @ts-ignore – allow assignment in CT context
      win.fetch = stub as any;
    });

    cy.mount(<Upgrade />);

    cy.findByText('core');
    cy.findByLabelText(/Select CompA/i).click();
    cy.findByRole('button', { name: /publish/i }).click();
    cy.findByRole('button', { name: /publish now/i }).click();

    // Axe color-contrast check on the rendered page
    cy.injectAxe();
    cy.checkA11y(undefined, { runOnly: { type: 'rule', values: ['color-contrast'] } });
  });
});
