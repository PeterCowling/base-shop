// packages/ui/src/components/cms/blocks/BlogListing.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '@acme/ui/story-utils/createStories';

import BlogListing from './BlogListing';
import fixture from './BlogListing.fixtures.json';

const meta: Meta<typeof BlogListing> = {
  title: 'CMS Blocks/BlogListing/Matrix',
  component: BlogListing,
  args: { posts: fixture.posts },
};
export default meta;

type Story = StoryObj<typeof BlogListing>;
const baseArgs = meta.args!;

const Post = z.object({ title: z.string(), excerpt: z.string().optional(), url: z.string().optional(), shopUrl: z.string().optional() });
try { z.object({ posts: z.array(Post) }).parse(fixture); } catch (e) { console.error('Invalid BlogListing fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
