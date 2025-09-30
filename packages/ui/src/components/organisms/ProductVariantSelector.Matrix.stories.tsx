// packages/ui/src/components/organisms/ProductVariantSelector.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { ProductVariantSelector } from './ProductVariantSelector';
import { makeStateStory } from '../../story-utils/createStories';

const meta: Meta<typeof ProductVariantSelector> = {
  title: 'Organisms/Product Variant Selector/Matrix',
  component: ProductVariantSelector,
  parameters: { docs: { autodocs: false } },
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Variant picker for colors/sizes/quantity. Stories exercise default, loading, empty, error, and RTL with mobile viewport.',
      },
    },
  },
  args: {
    colors: ['Black', 'White', 'Red'],
    sizes: ['S', 'M', 'L'],
    quantity: 1,
  },
};
export default meta;

type Story = StoryObj<typeof ProductVariantSelector>;
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

export const Empty: Story = makeStateStory(baseArgs, { colors: [], sizes: [] }, 'empty', {
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
  tags: ['visual', 'ci'],
});
