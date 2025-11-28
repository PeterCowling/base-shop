// packages/ui/src/components/cms/blocks/StoreLocatorBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import StoreLocatorBlock from './StoreLocatorBlock';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './StoreLocatorBlock.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof StoreLocatorBlock> = {
  title: 'CMS Blocks/StoreLocatorBlock/Matrix',
  component: StoreLocatorBlock,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof StoreLocatorBlock>;
const baseArgs = meta.args!;

const Loc = z.object({ lat: z.union([z.number(), z.string()]), lng: z.union([z.number(), z.string()]), label: z.string().optional() });
try { z.object({ locations: z.array(Loc), zoom: z.number().optional() }).parse(fixture); } catch (e) { console.error('Invalid StoreLocatorBlock fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

