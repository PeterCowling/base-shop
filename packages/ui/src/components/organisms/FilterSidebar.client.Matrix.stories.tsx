// packages/ui/src/components/organisms/FilterSidebar.client.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import React, { useState } from 'react';
import { FilterSidebar } from './FilterSidebar.client';
import { makeStateStory } from '../../story-utils/createStories';
import { expect, userEvent, within } from '@storybook/test';

const meta: Meta<typeof FilterSidebar> = {
  title: 'Organisms/Filter Sidebar (Client)/Matrix',
  component: FilterSidebar,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Client-side filter drawer for PLP/search. Matrix covers loading/empty/error + RTL for mobile filtering reliability.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof FilterSidebar>;

function Template(args: React.ComponentProps<typeof FilterSidebar>) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="flex">
      <FilterSidebar {...args} open={isOpen} onOpenChange={setIsOpen} />
      <div className="p-4 text-sm text-muted-foreground">Content area</div>
    </div>
  );
}

const baseArgs: React.ComponentProps<typeof FilterSidebar> = {
  categories: ['Shoes', 'Shirts', 'Accessories'],
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  colors: ['Black', 'White', 'Green', 'Blue'],
  priceRange: { min: 0, max: 200 },
  onChange: () => {},
  onApply: () => {},
  onReset: () => {},
};

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  render: (args) => <Template {...args} />,
});

export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
  render: (args) => <Template {...args} />,
});

export const Empty: Story = makeStateStory(
  baseArgs,
  { categories: [], sizes: [], colors: [] },
  'empty',
  {
    a11y: true,
    viewports: ['mobile1'],
    tags: ['visual'],
    render: (args) => <Template {...args} />,
  }
);

export const Error: Story = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
  render: (args) => <Template {...args} />,
});

export const RTL: Story = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  render: (args) => <Template {...args} />,
});

export const KeyboardClose: Story = {
  render: (args) => <Template {...args} />,
  args: { ...baseArgs },
  parameters: { a11y: true, tags: ['visual', 'ci'], viewports: ['mobile1'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.keyboard('{Escape}');
    expect(canvas.queryByText(/Content area/)).toBeInTheDocument();
  },
};
