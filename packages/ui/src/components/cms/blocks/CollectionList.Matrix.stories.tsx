// packages/ui/src/components/cms/blocks/CollectionList.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import CollectionList from './CollectionList';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './CollectionList.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof CollectionList> = {
  title: 'CMS Blocks/CollectionList/Matrix',
  component: CollectionList,
  tags: ['autodocs'],
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof CollectionList>;
const baseArgs = meta.args!;

const Category = z.object({ id: z.string(), title: z.string() });
try { z.object({ collections: z.array(Category), minItems: z.number().optional(), maxItems: z.number().optional() }).parse(fixture); } catch (e) { console.error('Invalid CollectionList fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

