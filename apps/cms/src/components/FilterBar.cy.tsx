import React from 'react';
import FilterBar, { type FilterDefinition, type Filters } from '@platform-core/components/shop/FilterBar';

describe('FilterBar (CT)', { tags: ['forms'] }, () => {
  it('emits typed values for selects and numbers; clear works', () => {
    const defs: FilterDefinition[] = [
      { name: 'size', label: 'Size', type: 'select', options: ['S', 'M', 'L'] },
      { name: 'maxPrice', label: 'Max Price', type: 'number' },
    ];
    const onChange = cy.stub().as('onChange');

    cy.mount(
      <div style={{ maxWidth: 600 }}>
        <FilterBar definitions={defs} onChange={onChange} />
      </div>
    );

    cy.findByLabelText('Size:').find('select').select('M');
    cy.get('@onChange').should('have.been.calledWith', { size: 'M' } as Filters);

    cy.findByLabelText('Max Price:').find('input').type('200');
    cy.get('@onChange').should('have.been.calledWith', { size: 'M', maxPrice: 200 } as Filters);

    cy.contains('button', 'Clear Filters').click();
    cy.get('@onChange').should('have.been.calledWith', {} as Filters);
  });
});

