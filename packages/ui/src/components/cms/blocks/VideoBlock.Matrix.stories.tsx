// packages/ui/src/components/cms/blocks/VideoBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import VideoBlock from './VideoBlock';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './VideoBlock.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof VideoBlock> = {
  title: 'CMS Blocks/VideoBlock/Matrix',
  component: VideoBlock,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof VideoBlock>;
const baseArgs = meta.args!;

try { z.object({ src: z.string().url(), autoplay: z.boolean().optional() }).parse(fixture); } catch (e) { console.error('Invalid VideoBlock fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

