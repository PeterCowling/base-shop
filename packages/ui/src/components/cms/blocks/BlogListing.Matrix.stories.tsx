// packages/ui/src/components/cms/blocks/BlogListing.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import BlogListing from './BlogListing';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './BlogListing.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/BlogListing/Matrix',
  component: BlogListing,
  parameters: { docs: { autodocs: false } },
  args: { posts: fixture.posts },
} satisfies Meta<typeof BlogListing>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

const Post = z.object({ title: z.string(), excerpt: z.string().optional(), url: z.string().optional(), shopUrl: z.string().optional() });
try { z.object({ posts: z.array(Post) }).parse(fixture); } catch (e) { console.error('Invalid BlogListing fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

