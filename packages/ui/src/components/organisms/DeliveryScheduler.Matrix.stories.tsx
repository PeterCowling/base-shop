// packages/ui/src/components/organisms/DeliveryScheduler.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';

import { makeStateStory } from '../../story-utils/createStories';

import { DeliveryScheduler } from './DeliveryScheduler';

const meta: Meta<typeof DeliveryScheduler> = {
  title: 'Organisms/Delivery Scheduler/Matrix',
  component: DeliveryScheduler,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Delivery date/time picker used during checkout. Matrix adds loading/empty/error + RTL for fulfillment reliability.',
      },
    },
  },
  args: {
    regions: ['Zone 1', 'Zone 2'],
    windows: ['8am-12pm', '12pm-4pm', '4pm-8pm'],
    onChange: () => {},
  },
};
export default meta;

type Story = StoryObj<typeof DeliveryScheduler>;
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

export const Empty: Story = makeStateStory(baseArgs, { regions: [], windows: [] }, 'empty', {
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
