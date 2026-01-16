import React from 'react';
import { DataTable } from '@acme/ui/components/organisms/DataTable';

type Row = { id: number; name: string };

describe('DataTable (CT)', { tags: ['tables'] }, () => {
  it('selects rows via checkbox and on row click', () => {
    const rows: Row[] = [
      { id: 1, name: 'Alpha' },
      { id: 2, name: 'Beta' },
      { id: 3, name: 'Gamma' },
    ];
    const onSelectionChange = cy.stub().as('onSelectionChange');

    cy.mount(
      <div style={{ maxWidth: 600 }}>
        <DataTable
          rows={rows}
          columns={[
            { header: 'ID', render: (r: Row) => <span>{r.id}</span>, width: '80px' },
            { header: 'Name', render: (r: Row) => <span>{r.name}</span> },
          ]}
          selectable
          onSelectionChange={onSelectionChange}
        />
      </div>
    );

    // Click first row checkbox
    cy.findAllByRole('checkbox').eq(0).click({ force: true });
    cy.get('@onSelectionChange').should('have.been.calledWith', [{ id: 1, name: 'Alpha' }]);

    // Click second row (row-click selection)
    cy.findByText('Beta').closest('tr')!.click();
    cy.get('@onSelectionChange').should('have.been.calledWith', [
      { id: 1, name: 'Alpha' },
      { id: 2, name: 'Beta' },
    ]);

    // Toggle first row off via checkbox again
    cy.findAllByRole('checkbox').eq(0).click({ force: true });
    cy.get('@onSelectionChange').should('have.been.calledWith', [{ id: 2, name: 'Beta' }]);
  });
});
