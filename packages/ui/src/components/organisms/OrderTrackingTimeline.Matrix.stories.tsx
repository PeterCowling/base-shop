// packages/ui/src/components/organisms/OrderTrackingTimeline.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';

import { makeStateStory } from '../../story-utils/createStories';

import { type OrderStep,OrderTrackingTimeline } from './OrderTrackingTimeline';

const steps: OrderStep[] = [
  { label: 'Order placed', date: '2025-04-02', complete: true },
  { label: 'Packed', date: '2025-04-03', complete: true },
  { label: 'Shipped', date: '2025-04-04', complete: true },
  { label: 'Out for delivery', date: '2025-04-05' },
];

const meta: Meta<typeof OrderTrackingTimeline> = {
  title: 'Organisms/Order Tracking Timeline/Matrix',
  component: OrderTrackingTimeline,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Vertical order timeline used across tracking pages. Matrix adds empty/error/loading + RTL for reliable post-purchase flows.',
      },
    },
  },
  args: {
    steps,
    trackingEnabled: true,
  },
};
export default meta;

type Story = StoryObj<typeof OrderTrackingTimeline>;
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
});

export const Loading: Story = makeStateStory(
  baseArgs,
  { steps: [{ label: 'Fetching tracking events…' }] },
  'loading',
  {
    viewports: ['mobile1'],
    tags: ['visual'],
  }
);

export const Empty: Story = makeStateStory(baseArgs, { steps: [] }, 'empty', {
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
