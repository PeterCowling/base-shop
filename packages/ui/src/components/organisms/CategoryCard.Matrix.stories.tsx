// packages/ui/src/components/organisms/CategoryCard.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { CategoryCard, type Category } from './CategoryCard';
import { makeStateStory } from '../../story-utils/createStories';

const category: Category = {
  id: 'outerwear',
  title: 'Outerwear',
  image: 'https://placehold.co/480x480/png',
  description: 'Coats, shells, and puffers for launch drops.',
};

const meta: Meta<typeof CategoryCard> = {
  title: 'Organisms/Category Card/Matrix',
  component: CategoryCard,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Category tile used across PLP/landing. Matrix covers default/loading/empty/error + RTL for merchandising grids.',
      },
    },
  },
  args: {
    category,
  },
};
export default meta;

type Story = StoryObj<typeof CategoryCard>;
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

export const Empty: Story = makeStateStory(baseArgs, { category: { ...category, title: '', image: '' } }, 'empty', {
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
