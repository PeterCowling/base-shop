// packages/ui/src/components/cms/blocks/SocialProof.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '../../../story-utils/createStories';

import SocialProof from './SocialProof';
import fixture from './SocialProof.fixtures.json';

const meta: Meta<typeof SocialProof> = {
  title: 'CMS Blocks/SocialProof/Matrix',
  component: SocialProof,
  args: { ...fixture },
  parameters: { docs: { description: { component: 'Rating/testimonials/UGC/influencer/logo social proof with optional Organization JSON-LD.' } } },
};
export default meta;

type Story = StoryObj<typeof SocialProof>;
const baseArgs = meta.args!;

const Rating = z.object({ rating: z.number(), count: z.number().optional() });
const Testimonial = z.object({ quote: z.string(), name: z.string().optional() });
const UGC = z.object({ src: z.string(), alt: z.string().optional(), author: z.string().optional(), handle: z.string().optional(), href: z.string().optional() });
const Logo = z.object({ src: z.string(), alt: z.string().optional(), href: z.string().optional() });
const Influencer = z.object({ name: z.string(), handle: z.string().optional(), avatarSrc: z.string().optional(), href: z.string().optional(), quote: z.string().optional() });
try {
  z.object({
    rating: Rating.optional(),
    testimonials: z.array(Testimonial).optional(),
    ugc: z.array(UGC).optional(),
    influencers: z.array(Influencer).optional(),
    logos: z.array(Logo).optional(),
    emitOrgSchema: z.boolean().optional(),
    orgName: z.string().optional(),
    orgSameAs: z.array(z.string()).optional(),
  }).parse(fixture);
} catch (e) { console.error('Invalid SocialProof fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });

export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
