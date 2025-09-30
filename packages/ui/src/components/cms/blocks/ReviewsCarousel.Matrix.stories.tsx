// packages/ui/src/components/cms/blocks/ReviewsCarousel.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import CmsReviewsCarousel from './ReviewsCarousel';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './ReviewsCarousel.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/ReviewsCarousel/Matrix',
  component: CmsReviewsCarousel,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
} satisfies Meta<typeof CmsReviewsCarousel>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

try { z.object({ reviews: z.array(z.object({ quote: z.string(), name: z.string().optional() })), minItems: z.number().optional(), maxItems: z.number().optional() }).parse(fixture); } catch (e) { console.error('Invalid ReviewsCarousel fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

