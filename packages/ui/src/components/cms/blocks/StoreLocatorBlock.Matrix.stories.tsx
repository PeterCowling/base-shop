// packages/ui/src/components/cms/blocks/StoreLocatorBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '../../../story-utils/createStories';

import StoreLocatorBlock from './StoreLocatorBlock';
import fixture from './StoreLocatorBlock.fixtures.json';

const meta: Meta<typeof StoreLocatorBlock> = {
  title: 'CMS Blocks/StoreLocatorBlock/Matrix',
  component: StoreLocatorBlock,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof StoreLocatorBlock>;
const baseArgs = meta.args!;

const Loc = z.object({ lat: z.union([z.number(), z.string()]), lng: z.union([z.number(), z.string()]), label: z.string().optional() });
try { z.object({ locations: z.array(Loc), zoom: z.number().optional() }).parse(fixture); } catch (e) { console.error('Invalid StoreLocatorBlock fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
