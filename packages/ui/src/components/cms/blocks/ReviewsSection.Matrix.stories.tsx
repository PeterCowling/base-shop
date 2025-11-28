// packages/ui/src/components/cms/blocks/ReviewsSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import ReviewsSection from './ReviewsSection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './ReviewsSection.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof ReviewsSection> = {
  title: 'CMS Blocks/ReviewsSection/Matrix',
  component: ReviewsSection,
  parameters: { docs: { autodocs: false } },
  args: { provider: 'custom', items: fixture.items, showAggregate: true, emitJsonLd: true },
  parameters: { docs: { description: { component: 'Product reviews list with optional aggregate rating and JSON-LD.' } } },
};
export default meta;

type Story = StoryObj<typeof ReviewsSection>;
const baseArgs = meta.args!;

const ReviewSchema = z.object({ id: z.string(), author: z.string().optional(), rating: z.number().optional(), title: z.string().optional(), body: z.string().optional(), createdAt: z.string().optional() });
const FixtureSchema = z.object({ provider: z.enum(['custom','yotpo','okendo']).optional(), productId: z.string().optional(), items: z.array(ReviewSchema).optional(), minRating: z.number().optional(), showAggregate: z.boolean().optional(), emitJsonLd: z.boolean().optional() });
try { FixtureSchema.parse(fixture); } catch (e) { console.error('Invalid ReviewsSection fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });

