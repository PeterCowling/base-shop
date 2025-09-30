// packages/ui/src/components/cms/blocks/ShowcaseSection.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import ShowcaseSection from './ShowcaseSection';

const meta = {
  component: ShowcaseSection,
  args: {
    preset: 'featured',
    limit: 12,
  },
} satisfies Meta<typeof ShowcaseSection>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Carousel = {
  args: { layout: 'carousel' },
} satisfies Story;

export const Grid = {
  args: { layout: 'grid', gridCols: 3 },
} satisfies Story;

