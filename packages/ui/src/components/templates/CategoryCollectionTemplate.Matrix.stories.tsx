// packages/ui/src/components/templates/CategoryCollectionTemplate.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';

import { makeStateStory } from '../../story-utils/createStories';
import type { Category } from '../organisms/CategoryCard';

import { CategoryCollectionTemplate } from './CategoryCollectionTemplate';

const categories: Category[] = [
  { id: 'outerwear', title: 'Outerwear', image: 'https://placehold.co/480x480/png', description: 'Coats, shells, and puffers.' },
  { id: 'sneakers', title: 'Sneakers', image: 'https://placehold.co/480x480/jpg', description: 'Daily drivers and performance.' },
  { id: 'accessories', title: 'Accessories', image: 'https://placehold.co/480x480/webp', description: 'Belts, wallets, tech.' },
  { id: 'home', title: 'Home', image: 'https://placehold.co/480x480/avif', description: 'Decor, textiles, kitchen.' },
];

const meta: Meta<typeof CategoryCollectionTemplate> = {
  title: 'Templates/Category Collection/Matrix',
  component: CategoryCollectionTemplate,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Grid of category tiles used on home and landing pages. Matrix captures loading/empty/error/RTL so launch previews catch gaps.',
      },
    },
  },
  args: {
    categories,
    columns: 3,
  },
};
export default meta;

type Story = StoryObj<typeof CategoryCollectionTemplate>;
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Three-column grid with four categories and images.',
});

export const Loading: Story = makeStateStory(
  baseArgs,
  { categories: categories.slice(0, 2), columns: 2 },
  'loading',
  {
    viewports: ['mobile1'],
    tags: ['visual'],
    docsDescription: 'Reduced set to mimic a partial load while CMS resolves.',
  }
);

export const Empty: Story = makeStateStory(baseArgs, { categories: [] }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Empty collection when no categories are configured.',
});

export const Error: Story = makeStateStory(baseArgs, { categories }, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
  docsDescription: 'Error state for CMS/category fetch failure.',
});

export const RTL: Story = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'RTL tile ordering and text alignment.',
});
