// packages/ui/src/components/cms/blocks/ShowcaseSection.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';

import ShowcaseSection from './ShowcaseSection';

const meta: Meta<typeof ShowcaseSection> = {
  title: 'CMS Blocks/ShowcaseSection',
  component: ShowcaseSection,
  args: {
    preset: 'featured',
    limit: 12,
  },
};
export default meta;

export const Carousel: StoryObj<typeof ShowcaseSection> = {
  args: { layout: 'carousel' },
};

export const Grid: StoryObj<typeof ShowcaseSection> = {
  args: { layout: 'grid', gridCols: 3 },
};

