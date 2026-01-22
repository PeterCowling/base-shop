// packages/ui/src/components/cms/blocks/SocialFeed.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '@acme/ui/story-utils/createStories';

import SocialFeed from './SocialFeed';
import fixture from './SocialFeed.fixtures.json';

const meta: Meta<typeof SocialFeed> = {
  title: 'CMS Blocks/SocialFeed/Matrix',
  component: SocialFeed,
  args: { ...fixture },
  parameters: { docs: { description: { component: 'Embeds a Twitter or Instagram feed based on account or hashtag.' } } },
};
export default meta;

type Story = StoryObj<typeof SocialFeed>;
const baseArgs = meta.args!;

try { z.object({ platform: z.enum(['twitter','instagram']), account: z.string().optional(), hashtag: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid SocialFeed fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
