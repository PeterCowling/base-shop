// packages/ui/src/components/cms/blocks/CampaignHeroSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '@acme/ui/story-utils/createStories';

import CampaignHeroSection from './CampaignHeroSection';
import fixture from './CampaignHeroSection.fixtures.json';

const meta: Meta<typeof CampaignHeroSection> = {
  title: 'CMS Blocks/CampaignHeroSection/Matrix',
  component: CampaignHeroSection,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof CampaignHeroSection>;
const baseArgs = meta.args!;

const Hotspot = z.object({ x: z.number(), y: z.number(), sku: z.string().optional() });
try { z.object({ mediaType: z.enum(['image','video']).optional(), imageSrc: z.string().optional(), imageAlt: z.string().optional(), videoSrc: z.string().optional(), videoPoster: z.string().optional(), usps: z.array(z.string()).optional(), hotspots: z.array(Hotspot).optional(), countdownTarget: z.string().optional(), timezone: z.string().optional(), onExpire: z.enum(['hide','swap']).optional(), swapSectionId: z.string().optional(), experimentKey: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid CampaignHeroSection fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
