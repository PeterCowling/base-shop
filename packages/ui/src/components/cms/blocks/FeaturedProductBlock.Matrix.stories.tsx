// packages/ui/src/components/cms/blocks/FeaturedProductBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import FeaturedProductBlock from './FeaturedProductBlock';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './FeaturedProductBlock.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof FeaturedProductBlock> = {
  title: 'CMS Blocks/FeaturedProductBlock/Matrix',
  component: FeaturedProductBlock,
  tags: ['autodocs'],
  args: { ...fixture },
  parameters: { docs: { description: { component: 'Highlight a single feature product from a collection or explicit SKU.' } } },
};
export default meta;

type Story = StoryObj<typeof FeaturedProductBlock>;
const baseArgs = meta.args!;

try { z.object({ collectionId: z.string().optional(), sku: z.object({ id: z.string() }).optional() }).parse(fixture); } catch (e) { console.error('Invalid FeaturedProductBlock fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });

