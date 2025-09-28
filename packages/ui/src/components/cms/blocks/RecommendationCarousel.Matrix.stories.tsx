// packages/ui/src/components/cms/blocks/RecommendationCarousel.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import CmsRecommendationCarousel from './RecommendationCarousel';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './RecommendationCarousel.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof CmsRecommendationCarousel> = {
  title: 'CMS Blocks/RecommendationCarousel/Matrix',
  component: CmsRecommendationCarousel,
  tags: ['autodocs'],
  args: { minItems: 1, maxItems: 4 },
  parameters: {
    layout: 'padded',
    docs: { description: { component: 'Recommendation carousel; uses internal products or endpoint runtime props. Matrix covers layout and RTL.' } },
  },
};
export default meta;

type Story = StoryObj<typeof CmsRecommendationCarousel>;
const baseArgs = meta.args!;

// Validate fixture shape
const FixtureSchema = z.object({
  minItems: z.number().optional(),
  maxItems: z.number().optional(),
  endpoint: z.string().optional(),
});
try { FixtureSchema.parse(fixture); } catch (e) { console.error('Invalid RecommendationCarousel fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
});

export const RTL: Story = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
});

