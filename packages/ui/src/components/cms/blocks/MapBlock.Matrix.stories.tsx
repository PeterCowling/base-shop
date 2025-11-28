// packages/ui/src/components/cms/blocks/MapBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import MapBlock from './MapBlock';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './MapBlock.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof MapBlock> = {
  title: 'CMS Blocks/MapBlock/Matrix',
  component: MapBlock,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof MapBlock>;
const baseArgs = meta.args!;

try { z.object({ lat: z.number(), lng: z.number(), zoom: z.number().optional() }).parse(fixture); } catch (e) { console.error('Invalid MapBlock fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

