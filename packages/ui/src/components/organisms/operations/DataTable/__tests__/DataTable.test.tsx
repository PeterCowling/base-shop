import { fireEvent, render, screen, within } from '@testing-library/react';

import { DataTable, type DataTableColumn, type DataTableProps } from '../DataTable';

type Row = {
  id: number;
  name: string;
  category: string;
  qty: number;
};

const rows: Row[] = [
  { id: 1, name: 'Alpha', category: 'A', qty: 5 },
  { id: 2, name: 'Bravo', category: 'B', qty: 2 },
  { id: 3, name: 'Charlie', category: 'C', qty: 9 },
];

const columns: DataTableColumn<Row>[] = [
  {
    id: 'name',
    header: 'Name',
    getValue: (row) => row.name,
    sortable: true,
  },
  {
    id: 'qty',
    header: 'Qty',
    getValue: (row) => row.qty,
    sortable: true,
    align: 'right',
  },
  {
    id: 'category',
    header: 'Category',
    getValue: (row) => row.category,
  },
];

function renderTable(overrides: Partial<DataTableProps<Row>> = {}) {
  return render(
    <DataTable<Row>
      data={rows}
      columns={columns}
      searchable={true}
      searchPlaceholder="Search rows"
      {...overrides}
    />
  );
}

describe('Operations DataTable', () => {
  it('uses semantic token classes for table chrome', () => {
    const { container } = renderTable();

    const shell = container.querySelector('div.rounded-lg.border');
    const thead = container.querySelector('thead');
    const tbody = container.querySelector('tbody');

    expect(shell).toHaveClass('border-border-1');
    expect(thead).toHaveClass('bg-surface-1', 'border-border-1');
    expect(tbody).toHaveClass('bg-bg', 'divide-border-1');
  });

  it('uses muted foreground tokens for search icon and empty/loading rows', () => {
    const { container, rerender } = renderTable({ loading: true });

    const searchIcon = container.querySelector('svg.h-4.w-4.text-muted-foreground');
    expect(searchIcon).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toHaveClass('text-muted-foreground');

    rerender(
      <DataTable<Row>
        data={[]}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search rows"
        emptyMessage="Nothing here"
      />
    );

    expect(screen.getByText('Nothing here')).toHaveClass('text-muted-foreground');
  });

  it('filters rows by search term and allows clearing', () => {
    renderTable();

    const search = screen.getByPlaceholderText('Search rows');
    fireEvent.change(search, { target: { value: 'br' } });

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(screen.getByText('Bravo')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('sorts rows when sortable header is clicked', () => {
    renderTable();

    const header = screen.getByText('Qty').closest('th');
    expect(header).toBeInTheDocument();

    fireEvent.click(header!);

    const bodyRows = screen.getAllByRole('row').slice(1);
    const firstRow = bodyRows[0];
    expect(within(firstRow).getByText('Bravo')).toBeInTheDocument();

    fireEvent.click(header!);

    const resortedRows = screen.getAllByRole('row').slice(1);
    expect(within(resortedRows[0]).getByText('Charlie')).toBeInTheDocument();
  });
});
