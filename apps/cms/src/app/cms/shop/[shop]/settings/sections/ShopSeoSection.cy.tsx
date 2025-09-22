import React from 'react';
import ShopSeoSection from './ShopSeoSection';

describe('ShopSeoSection (CT)', { tags: ['forms'] }, () => {
  it('emits filters as array and reflects errors', () => {
    const onCatalogFiltersChange = cy.stub().as('onChange');
    cy.mount(<ShopSeoSection catalogFilters={['color', 'size']} onCatalogFiltersChange={onCatalogFiltersChange} />);

    cy.findByLabelText('Catalog filters').clear().type('brand, material');
    cy.get('@onChange').should('have.been.calledWith', ['brand', 'material']);

    const errors = { catalogFilters: ['Must be valid list'] } as const;
    cy.mount(
      <ShopSeoSection catalogFilters={['color']} errors={errors} onCatalogFiltersChange={() => {}} />
    );

    cy.findByLabelText('Catalog filters')
      .should('have.attr', 'aria-invalid', 'true')
      .and('have.attr', 'aria-describedby', 'catalog-filters-error');
    cy.findByText('Must be valid list').should('exist');
  });
});

