// packages/ui/src/components/cms/blocks/CampaignHeroSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import CampaignHeroSection from './CampaignHeroSection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './CampaignHeroSection.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof CampaignHeroSection> = {
  title: 'CMS Blocks/CampaignHeroSection/Matrix',
  component: CampaignHeroSection,
  tags: ['autodocs'],
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof CampaignHeroSection>;
const baseArgs = meta.args!;

const Hotspot = z.object({ x: z.number(), y: z.number(), sku: z.string().optional() });
try { z.object({ mediaType: z.enum(['image','video']).optional(), imageSrc: z.string().optional(), imageAlt: z.string().optional(), videoSrc: z.string().optional(), videoPoster: z.string().optional(), usps: z.array(z.string()).optional(), hotspots: z.array(Hotspot).optional(), countdownTarget: z.string().optional(), timezone: z.string().optional(), onExpire: z.enum(['hide','swap']).optional(), swapSectionId: z.string().optional(), experimentKey: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid CampaignHeroSection fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });

