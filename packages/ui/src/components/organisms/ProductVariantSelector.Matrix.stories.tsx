// packages/ui/src/components/organisms/ProductVariantSelector.Matrix.stories.tsx

import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, fn, userEvent, within } from '@storybook/test';

import { makeStateStory } from '../../story-utils/createStories';

import { ProductVariantSelector, type VariantSelectorProps } from './ProductVariantSelector';

const meta: Meta<typeof ProductVariantSelector> = {
  title: 'Organisms/Product Variant Selector/Matrix',
  component: ProductVariantSelector,
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
    onColorChange: fn(),
    onSizeChange: fn(),
    onQuantityChange: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof ProductVariantSelector>;
const baseArgs = {} as Record<string, never>;

const VariantSelectionPlayTemplate = (args: VariantSelectorProps) => {
  const [color, setColor] = React.useState<string | undefined>();
  const [size, setSize] = React.useState<string | undefined>('S');
  const [qty, setQty] = React.useState(1);

  return (
    <ProductVariantSelector
      {...args}
      selectedColor={color}
      selectedSize={size}
      quantity={qty}
      onColorChange={(c) => {
        setColor(c);
        args.onColorChange?.(c);
      }}
      onSizeChange={(s) => {
        setSize(s);
        args.onSizeChange?.(s);
      }}
      onQuantityChange={(q) => {
        setQty(q);
        args.onQuantityChange?.(q);
      }}
    />
  );
};

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

export const VariantSelectionPlay: Story = {
  render: VariantSelectionPlayTemplate,
  parameters: {
    a11y: true,
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
    docs: { description: { story: 'Interactive variant selection for color, size, and quantity.' } },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const redSwatch = canvas.getByRole('button', { name: /red/i });
    await userEvent.click(redSwatch);
    expect(args.onColorChange).toHaveBeenCalledWith('Red');

    const sizeSelect = canvas.getByRole('combobox');
    await userEvent.selectOptions(sizeSelect, 'M');
    expect(args.onSizeChange).toHaveBeenCalledWith('M');

    const inc = canvas.getByRole('button', { name: '+' });
    await userEvent.click(inc);
    expect(args.onQuantityChange).toHaveBeenCalledWith(2);
  },
};
