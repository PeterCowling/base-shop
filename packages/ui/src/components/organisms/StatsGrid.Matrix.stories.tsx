// packages/ui/src/components/organisms/StatsGrid.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';

import { makeStateStory } from '../../story-utils/createStories';

import { type StatItem,StatsGrid } from './StatsGrid';

const stats: StatItem[] = [
  { label: 'Orders', value: 124 },
  { label: 'Revenue', value: '$12.4k' },
  { label: 'Conversion', value: '3.2%' },
  { label: 'AOV', value: '$98' },
];

const meta: Meta<typeof StatsGrid> = {
  title: 'Organisms/Stats Grid/Matrix',
  component: StatsGrid,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'KPI grid used on dashboards. Matrix covers default/loading/empty/error + RTL for operational readiness.',
      },
    },
  },
  args: {
    stats,
  },
};
export default meta;

type Story = StoryObj<typeof StatsGrid>;
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

export const Empty: Story = makeStateStory(baseArgs, { stats: [] }, 'empty', {
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
