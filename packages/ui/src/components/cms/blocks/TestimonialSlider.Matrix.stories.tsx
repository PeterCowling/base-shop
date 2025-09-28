// packages/ui/src/components/cms/blocks/TestimonialSlider.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import TestimonialSlider from './TestimonialSlider';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './TestimonialSlider.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof TestimonialSlider> = {
  title: 'CMS Blocks/TestimonialSlider/Matrix',
  component: TestimonialSlider,
  tags: ['autodocs'],
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof TestimonialSlider>;
const baseArgs = meta.args!;

try { z.object({ testimonials: z.array(z.object({ quote: z.string(), name: z.string().optional() })), minItems: z.number().optional(), maxItems: z.number().optional() }).parse(fixture); } catch (e) { console.error('Invalid TestimonialSlider fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

