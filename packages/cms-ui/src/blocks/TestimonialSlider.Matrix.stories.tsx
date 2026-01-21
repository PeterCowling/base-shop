// packages/ui/src/components/cms/blocks/TestimonialSlider.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '../../../story-utils/createStories';

import TestimonialSlider from './TestimonialSlider';
import fixture from './TestimonialSlider.fixtures.json';

const meta: Meta<typeof TestimonialSlider> = {
  title: 'CMS Blocks/TestimonialSlider/Matrix',
  component: TestimonialSlider,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof TestimonialSlider>;
const baseArgs = meta.args!;

try { z.object({ testimonials: z.array(z.object({ quote: z.string(), name: z.string().optional() })), minItems: z.number().optional(), maxItems: z.number().optional() }).parse(fixture); } catch (e) { console.error('Invalid TestimonialSlider fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
