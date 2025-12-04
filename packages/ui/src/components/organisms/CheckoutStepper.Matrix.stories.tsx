// packages/ui/src/components/organisms/CheckoutStepper.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { CheckoutStepper } from './CheckoutStepper';
import { makeStateStory } from '../../story-utils/createStories';

const steps = ['Cart', 'Shipping', 'Payment', 'Review'];

const meta: Meta<typeof CheckoutStepper> = {
  title: 'Organisms/Checkout Stepper/Matrix',
  component: CheckoutStepper,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Horizontal checkout progress indicator. Matrix ensures labels render across default/loading/empty/error and RTL on mobile.',
      },
    },
  },
  args: {
    steps,
    currentStep: 1,
  },
};
export default meta;

type Story = StoryObj<typeof CheckoutStepper>;
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
});

export const Loading: Story = makeStateStory(baseArgs, { currentStep: 0 }, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
});

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
