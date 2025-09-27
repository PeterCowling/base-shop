// packages/ui/components/organisms/OrderSummary.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import OrderSummary from './OrderSummary';
import { makeStateStory } from '../../story-utils/createStories';

const meta: Meta<typeof OrderSummary> = {
  title: 'Organisms/Order Summary/Matrix',
  component: OrderSummary,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof OrderSummary>;
const baseArgs = {} as Record<string, never>;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
});

export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
});

export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', {
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

