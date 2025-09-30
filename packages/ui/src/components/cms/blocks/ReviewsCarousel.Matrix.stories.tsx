// packages/ui/src/components/cms/blocks/ReviewsCarousel.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import CmsReviewsCarousel from './ReviewsCarousel';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './ReviewsCarousel.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof CmsReviewsCarousel> = {
  title: 'CMS Blocks/ReviewsCarousel/Matrix',
  component: CmsReviewsCarousel,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof CmsReviewsCarousel>;
const baseArgs = meta.args!;

try { z.object({ reviews: z.array(z.object({ quote: z.string(), name: z.string().optional() })), minItems: z.number().optional(), maxItems: z.number().optional() }).parse(fixture); } catch (e) { console.error('Invalid ReviewsCarousel fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

