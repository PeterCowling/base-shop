import type { Meta, StoryObj } from '@storybook/react'

import { DataTable } from './DataTable'

interface User {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  createdAt: Date
}

const mockUsers: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active', createdAt: new Date('2024-01-15') },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active', createdAt: new Date('2024-02-20') },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Manager', status: 'inactive', createdAt: new Date('2024-03-10') },
  { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'User', status: 'active', createdAt: new Date('2024-01-05') },
  { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Admin', status: 'active', createdAt: new Date('2024-02-15') },
]

// Status badge component for custom cell rendering
function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
  return (
    <span
      className={`
        px-2 py-1 text-xs rounded-full font-medium
        ${status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-fg'}
      `}
    >
      {status}
    </span>
  )
}

const meta: Meta<typeof DataTable> = {
  title: 'Organisms/Operations/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="context-operations p-8 min-h-screen bg-bg">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: 'A data table component with sorting, searching, and custom cell rendering. Optimized for operations contexts with dense data display.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof DataTable>

export const Default: Story = {
  args: {
    data: mockUsers,
    columns: [
      {
        id: 'id',
        header: 'ID',
        getValue: (row) => row.id,
        sortable: true,
        width: '80px',
      },
      {
        id: 'name',
        header: 'Name',
        getValue: (row) => row.name,
        sortable: true,
        filterable: true,
      },
      {
        id: 'email',
        header: 'Email',
        getValue: (row) => row.email,
        sortable: true,
        filterable: true,
      },
      {
        id: 'role',
        header: 'Role',
        getValue: (row) => row.role,
        sortable: true,
      },
      {
        id: 'status',
        header: 'Status',
        getValue: (row) => row.status,  // Returns primitive for sort
        cell: (row) => <StatusBadge status={row.status} />,  // Custom render
        sortable: true,
        filterable: false,  // Don't search JSX
      },
    ],
  },
}

export const WithRowClick: Story = {
  args: {
    ...Default.args,
    onRowClick: (row) => {
      console.info('Row clicked:', row)
      alert(`Clicked: ${row.name}`)
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Table rows are clickable and trigger the onRowClick callback.',
      },
    },
  },
}

export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state shows a centered loading message.',
      },
    },
  },
}

export const Empty: Story = {
  args: {
    ...Default.args,
    data: [],
    emptyMessage: 'No users found',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state shows a customizable message when no data is available.',
      },
    },
  },
}

export const NoSearch: Story = {
  args: {
    ...Default.args,
    searchable: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Search bar can be disabled if not needed.',
      },
    },
  },
}

export const CustomAlignment: Story = {
  args: {
    data: mockUsers,
    columns: [
      {
        id: 'id',
        header: 'ID',
        getValue: (row) => row.id,
        sortable: true,
        width: '80px',
        align: 'right',
      },
      {
        id: 'name',
        header: 'Name',
        getValue: (row) => row.name,
        sortable: true,
        align: 'left',
      },
      {
        id: 'role',
        header: 'Role',
        getValue: (row) => row.role,
        sortable: true,
        align: 'center',
      },
      {
        id: 'status',
        header: 'Status',
        getValue: (row) => row.status,
        cell: (row) => <StatusBadge status={row.status} />,
        align: 'center',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Columns support left, center, and right alignment.',
      },
    },
  },
}

export const DateFormatting: Story = {
  args: {
    data: mockUsers,
    columns: [
      {
        id: 'name',
        header: 'Name',
        getValue: (row) => row.name,
        sortable: true,
      },
      {
        id: 'created',
        header: 'Created',
        getValue: (row) => row.createdAt.toISOString(),  // For sorting
        cell: (row) => row.createdAt.toLocaleDateString(),  // For display
        sortable: true,
      },
      {
        id: 'status',
        header: 'Status',
        getValue: (row) => row.status,
        cell: (row) => <StatusBadge status={row.status} />,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Dates can be sorted by ISO string while displaying in a user-friendly format.',
      },
    },
  },
}
