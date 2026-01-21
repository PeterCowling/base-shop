// packages/ui/src/components/organisms/DataTable.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';

import { makeStateStory } from '../../story-utils/createStories';

import { type Column,DataTable } from './DataTable';

interface OrderRow { id: string; customer: string; total: string; status: string; }

const rows: OrderRow[] = [
  { id: 'INV-1001', customer: 'Jane Doe', total: '$120.00', status: 'Paid' },
  { id: 'INV-1002', customer: 'John Smith', total: '$48.00', status: 'Pending' },
  { id: 'INV-1003', customer: 'Aria Lee', total: '$325.00', status: 'Refunded' },
];

const columns: Column<OrderRow>[] = [
  { header: 'Order', render: (r) => r.id, width: '8rem' },
  { header: 'Customer', render: (r) => r.customer },
  { header: 'Total', render: (r) => r.total, width: '6rem' },
  { header: 'Status', render: (r) => r.status, width: '6rem' },
];

const meta: Meta<typeof DataTable<OrderRow>> = {
  title: 'Organisms/Data Table/Matrix',
  component: DataTable,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Generic data table with selectable rows. Matrix ensures default/loading/empty/error/RTL render for ops dashboards.',
      },
    },
  },
  args: {
    rows,
    columns,
    selectable: true,
  },
};
export default meta;

type Story = StoryObj<typeof DataTable<OrderRow>>;
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
});

export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
});

export const Empty: Story = makeStateStory(baseArgs, { rows: [] }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
});

export const Error: Story = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
});

export const RTL: Story = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
});
