// packages/ui/src/components/cms/blocks/RecommendationCarousel.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import CmsRecommendationCarousel from './RecommendationCarousel';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './RecommendationCarousel.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/RecommendationCarousel/Matrix',
  component: CmsRecommendationCarousel,
  parameters: { docs: { autodocs: false } },
  args: { minItems: 1, maxItems: 4 },
  parameters: {
    layout: 'padded',
    docs: { description: { component: 'Recommendation carousel; uses internal products or endpoint runtime props. Matrix covers layout and RTL.' } },
  },
} satisfies Meta<typeof CmsRecommendationCarousel>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

// Validate fixture shape
const FixtureSchema = z.object({
  minItems: z.number().optional(),
  maxItems: z.number().optional(),
  endpoint: z.string().optional(),
});
try { FixtureSchema.parse(fixture); } catch (e) { console.error('Invalid RecommendationCarousel fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
}) satisfies Story;

export const RTL = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
}) satisfies Story;

