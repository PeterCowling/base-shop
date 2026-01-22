// packages/ui/src/components/cms/blocks/VideoBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '@acme/ui/story-utils/createStories';

import VideoBlock from './VideoBlock';
import fixture from './VideoBlock.fixtures.json';

const meta: Meta<typeof VideoBlock> = {
  title: 'CMS Blocks/VideoBlock/Matrix',
  component: VideoBlock,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof VideoBlock>;
const baseArgs = meta.args!;

try { z.object({ src: z.string().url(), autoplay: z.boolean().optional() }).parse(fixture); } catch (e) { console.error('Invalid VideoBlock fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
