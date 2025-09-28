// packages/ui/src/components/cms/blocks/SocialFeed.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import SocialFeed from './SocialFeed';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './SocialFeed.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof SocialFeed> = {
  title: 'CMS Blocks/SocialFeed/Matrix',
  component: SocialFeed,
  tags: ['autodocs'],
  args: { ...fixture },
  parameters: { docs: { description: { component: 'Embeds a Twitter or Instagram feed based on account or hashtag.' } } },
};
export default meta;

type Story = StoryObj<typeof SocialFeed>;
const baseArgs = meta.args!;

try { z.object({ platform: z.enum(['twitter','instagram']), account: z.string().optional(), hashtag: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid SocialFeed fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });

