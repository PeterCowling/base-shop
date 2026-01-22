// packages/ui/src/components/cms/blocks/SocialLinks.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '@acme/ui/story-utils/createStories';

import SocialLinks from './SocialLinks';
import fixture from './SocialLinks.fixtures.json';

const meta: Meta<typeof SocialLinks> = {
  title: 'CMS Blocks/SocialLinks/Matrix',
  component: SocialLinks,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof SocialLinks>;
const baseArgs = meta.args!;

try { z.object({ facebook: z.string().url().optional(), instagram: z.string().url().optional(), x: z.string().url().optional(), youtube: z.string().url().optional(), linkedin: z.string().url().optional() }).parse(fixture); } catch (e) { console.error('Invalid SocialLinks fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
