import React from 'react';
import ShopClient from './ShopClient.client';
import type { SKU } from '@acme/types';

const skus: SKU[] = [
  {
    id: '01JABCDEF00000000000000001',
    slug: 'red-sneaker',
    title: 'Red Sneaker',
    price: 12000,
    deposit: 0,
    stock: 10,
    forSale: true,
    forRental: false,
    media: [],
    sizes: ['S', 'M'],
    description: 'A red sneaker',
  },
  {
    id: '01JABCDEF00000000000000002',
    slug: 'blue-boot',
    title: 'Blue Boot',
    price: 18000,
    deposit: 0,
    stock: 5,
    forSale: true,
    forRental: false,
    media: [],
    sizes: ['M', 'L'],
    description: 'A blue boot',
  },
];

describe('ShopClient (CT)', { tags: ['forms'] }, () => {
  it('initialises from query and pushes updates via router', () => {
    const push = cy.stub().as('push');
    cy.mountWithRouter(
      <ShopClient skus={skus} />,
      { router: { pathname: '/en/shop', search: '?q=boot&size=M&color=blue&maxPrice=20000', push } }
    );

    // Search input reflects initial query
    cy.findByLabelText('Search products').should('have.value', 'boot');

    // Change query -> triggers router.push with updated q
    cy.findByLabelText('Search products').clear().type('sneaker');
    cy.get('@push').should('have.been.calledWith', '/en/shop?q=sneaker&size=M&color=blue&maxPrice=20000');

    // Change a filter in FilterBar (size -> L)
    cy.findByLabelText('Size:').find('select').select('L');
    cy.get('@push').should('have.been.calledWith', '/en/shop?q=sneaker&size=L&color=blue&maxPrice=20000');
  });
});

