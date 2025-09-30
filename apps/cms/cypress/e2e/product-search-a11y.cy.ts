import '@testing-library/cypress/add-commands';
import 'cypress-plugin-tab';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { SearchResultsTemplate } from '../../packages/ui/src/components/templates/SearchResultsTemplate';
import { CartProvider } from '@acme/platform-core/contexts/CartContext';
import { CurrencyProvider } from '@acme/platform-core/contexts/CurrencyContext';
import type { SKU } from '@acme/types';

const products: SKU[] = [
  {
    id: '1',
    slug: 'product-1',
    title: 'Product 1',
    price: 1000,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: 'https://placehold.co/300', type: 'image' }],
    sizes: [],
    description: '',
  },
  {
    id: '2',
    slug: 'product-2',
    title: 'Product 2',
    price: 1500,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: 'https://placehold.co/300', type: 'image' }],
    sizes: [],
    description: '',
  },
];

function App() {
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <SearchResultsTemplate
      suggestions={products.map((p) => p.title)}
      results={filtered}
      page={page}
      pageCount={2}
      minItems={1}
      maxItems={4}
      query={query}
      onQueryChange={setQuery}
      onPageChange={setPage}
      filters={
        <label htmlFor="size-filter">
          Size
          <select id="size-filter">
            <option value="">All</option>
            <option value="M">M</option>
          </select>
        </label>
      }
    />
  );
}

describe('Product search accessibility', () => {
  beforeEach(() => {
    cy.visit('about:blank').then((win) => {
      const origFetch = win.fetch.bind(win);
      cy.stub(win, 'fetch').callsFake((input, init) => {
        if (typeof input === 'string' && input.endsWith('/api/cart')) {
          return Promise.resolve(
            new win.Response(
              JSON.stringify({ cart: {} }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }
        return origFetch(input, init);
      });
      ReactDOM.createRoot(win.document.body).render(
        React.createElement(CurrencyProvider, null,
          React.createElement(CartProvider, null, React.createElement(App))
        )
      );
    });
  });

  it('supports keyboard navigation and has no a11y violations', () => {
    cy.injectAxe();
    cy.findByLabelText('Search products').should('be.visible');

    cy.get('body').tab();
    cy.focused().should('have.attr', 'aria-label', 'Search products');
    cy.focused().type('Product 2{enter}');
    cy.contains('Product 2').should('exist');
    cy.contains('Product 1').should('not.exist');

    cy.get('[role="list"], [role="grid"]').as('grid').should('exist');

    cy.tab();
    cy.focused().should('have.id', 'size-filter');
    cy.focused().type('{enter}');

    cy.tab();
    cy.focused().should('contain', 'Add to cart');
    cy.tab();
    cy.focused().should('contain', 'Add to cart');

    cy.tab();
    cy.focused().should('contain', 'Prev');
    cy.focused().type('{enter}');

    cy.tab();
    cy.focused().should('contain', '1');
    cy.tab();
    cy.focused().should('contain', '2');
    cy.tab();
    cy.focused().should('contain', 'Next');
    cy.focused().type('{enter}');
    cy.focused().should('be.disabled');

    cy.checkA11y(undefined, undefined, undefined, true);
  });
});
