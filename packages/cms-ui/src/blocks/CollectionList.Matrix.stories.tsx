// packages/ui/src/components/cms/blocks/CollectionList.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '@acme/ui/story-utils/createStories';

import CollectionList from './CollectionList';
import fixture from './CollectionList.fixtures.json';

const meta: Meta<typeof CollectionList> = {
  title: 'CMS Blocks/CollectionList/Matrix',
  component: CollectionList,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof CollectionList>;
const baseArgs = meta.args!;

const Category = z.object({ id: z.string(), title: z.string() });
try { z.object({ collections: z.array(Category), minItems: z.number().optional(), maxItems: z.number().optional() }).parse(fixture); } catch (e) { console.error('Invalid CollectionList fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
