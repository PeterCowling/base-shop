// packages/ui/src/components/cms/blocks/SocialFeed.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import SocialFeed from './SocialFeed';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './SocialFeed.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/SocialFeed/Matrix',
  component: SocialFeed,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
  parameters: { docs: { description: { component: 'Embeds a Twitter or Instagram feed based on account or hashtag.' } } },
} satisfies Meta<typeof SocialFeed>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

try { z.object({ platform: z.enum(['twitter','instagram']), account: z.string().optional(), hashtag: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid SocialFeed fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;
export const RTL = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] }) satisfies Story;

