// packages/ui/src/components/templates/OrderTrackingTemplate.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';

import { makeStateStory } from '../../story-utils/createStories';
import type { OrderStep } from '../organisms/OrderTrackingTimeline';

import { OrderTrackingTemplate } from './OrderTrackingTemplate';

const steps: OrderStep[] = [
  { label: 'Order placed', date: '2025-04-02', complete: true },
  { label: 'Packed', date: '2025-04-03', complete: true },
  { label: 'Shipped', date: '2025-04-04', complete: true },
  { label: 'Out for delivery', date: '2025-04-05' },
];

const meta: Meta<typeof OrderTrackingTemplate> = {
  title: 'Templates/Order Tracking/Matrix',
  component: OrderTrackingTemplate,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Shipment tracking timeline with reference and address. Matrix validates empty/error/loading and RTL for launch-day transparency.',
      },
    },
  },
  args: {
    orderId: 'ACME-TRACK-1234',
    steps,
    address: '123 Market St, San Francisco, CA',
  },
};
export default meta;

type Story = StoryObj<typeof OrderTrackingTemplate>;
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Happy path with four steps and shipping address.',
});

export const Loading: Story = makeStateStory(
  baseArgs,
  { steps: [{ label: 'Fetching tracking events…', complete: false }] },
  'loading',
  {
    viewports: ['mobile1'],
    tags: ['visual'],
    docsDescription: 'Loading placeholder while carrier data resolves.',
  }
);

export const Empty: Story = makeStateStory(baseArgs, { steps: [], address: undefined }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'No events yet; ensures null render path stays stable.',
});

export const Error: Story = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
  docsDescription: 'Error visualization for failed tracking lookups.',
});

export const RTL: Story = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'RTL timeline ordering and reference formatting.',
});
