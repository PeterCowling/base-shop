// packages/ui/components/templates/AccountDashboardTemplate.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import type { Column } from '../organisms/DataTable';
import type { StatItem } from '../organisms/StatsGrid';
import { AccountDashboardTemplate, type AccountDashboardTemplateProps } from './AccountDashboardTemplate';
import { makeStateStory } from '../../story-utils/createStories';

interface OrderRow { id: number; total: string; }

const user = { name: 'Jane Doe', email: 'jane@example.com', avatar: 'https://placehold.co/40' };
const stats: StatItem[] = [ { label: 'Orders', value: 12 }, { label: 'Wishlist', value: 3 } ];
const orders: OrderRow[] = [ { id: 1, total: '$10' }, { id: 2, total: '$20' } ];
const orderColumns: Column<OrderRow>[] = [ { header: 'ID', render: (r) => r.id }, { header: 'Total', render: (r) => r.total } ];

const DashboardForOrders: React.FC<AccountDashboardTemplateProps<OrderRow>> = (props) => (
  <AccountDashboardTemplate<OrderRow> {...props} />
);

const meta = {
  title: 'Templates/Account Dashboard/Matrix',
  component: DashboardForOrders,
  parameters: { docs: { autodocs: false } },
  parameters: {
    docs: {
      description: {
        component: 'Authenticated shopper dashboard template. Shows user header, KPI cards and orders table; generic-typed wrapper used for story.',
      },
    },
  },
  args: { user, stats, orders, orderColumns },
} satisfies Meta<typeof DashboardForOrders>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

export const Default = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Dashboard with user header, KPI cards and orders table.',
}) satisfies Story;

export const Loading = makeStateStory(baseArgs, { stats: [] }, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Simulated loading: KPI cards hidden.',
}) satisfies Story;

export const Empty = makeStateStory(baseArgs, { stats: [], orders: [], orderColumns: [] }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'No stats or orders; shows just the user header.',
}) satisfies Story;

export const Error = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
  docsDescription: 'Matrix completeness state; no network behavior.',
}) satisfies Story;

export const RTL = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'RTL sample for header, KPIs and table.',
}) satisfies Story;
