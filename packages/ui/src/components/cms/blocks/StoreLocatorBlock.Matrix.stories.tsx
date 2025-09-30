// packages/ui/src/components/cms/blocks/StoreLocatorBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import StoreLocatorBlock from './StoreLocatorBlock';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './StoreLocatorBlock.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/StoreLocatorBlock/Matrix',
  component: StoreLocatorBlock,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
} satisfies Meta<typeof StoreLocatorBlock>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

const Loc = z.object({ lat: z.union([z.number(), z.string()]), lng: z.union([z.number(), z.string()]), label: z.string().optional() });
try { z.object({ locations: z.array(Loc), zoom: z.number().optional() }).parse(fixture); } catch (e) { console.error('Invalid StoreLocatorBlock fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

