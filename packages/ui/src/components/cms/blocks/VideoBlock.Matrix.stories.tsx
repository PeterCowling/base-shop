// packages/ui/src/components/cms/blocks/VideoBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import VideoBlock from './VideoBlock';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './VideoBlock.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/VideoBlock/Matrix',
  component: VideoBlock,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
} satisfies Meta<typeof VideoBlock>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

try { z.object({ src: z.string().url(), autoplay: z.boolean().optional() }).parse(fixture); } catch (e) { console.error('Invalid VideoBlock fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

