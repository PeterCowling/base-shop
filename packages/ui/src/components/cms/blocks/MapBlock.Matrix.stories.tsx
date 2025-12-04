// packages/ui/src/components/cms/blocks/MapBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import MapBlock from './MapBlock';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './MapBlock.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof MapBlock> = {
  title: 'CMS Blocks/MapBlock/Matrix',
  component: MapBlock,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof MapBlock>;
const baseArgs = meta.args!;

try { z.object({ lat: z.number(), lng: z.number(), zoom: z.number().optional() }).parse(fixture); } catch (e) { console.error('Invalid MapBlock fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
