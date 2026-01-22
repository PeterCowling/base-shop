// packages/ui/src/components/cms/blocks/CartSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';

import { makeStateStory } from '@acme/ui/story-utils/createStories';

import CartSection from './CartSection';

const meta: Meta<typeof CartSection> = {
  title: 'CMS Blocks/CartSection/Matrix',
  component: CartSection,
};
export default meta;

type Story = StoryObj<typeof CartSection>;
export const Default: Story = makeStateStory({}, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
