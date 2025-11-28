// packages/ui/src/components/cms/blocks/SocialProof.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import SocialProof from './SocialProof';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './SocialProof.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof SocialProof> = {
  title: 'CMS Blocks/SocialProof/Matrix',
  component: SocialProof,
  parameters: { docs: { autodocs: false } },
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
