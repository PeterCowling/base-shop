// packages/ui/src/components/cms/blocks/HeroBanner.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import CmsHeroBanner from './HeroBanner';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './HeroBanner.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/HeroBanner/Matrix',
  component: CmsHeroBanner,
  parameters: { docs: { autodocs: false } },
  args: { slides: fixture.slides },
} satisfies Meta<typeof CmsHeroBanner>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

const Slide = z.object({ src: z.string(), altKey: z.string().optional(), headlineKey: z.string(), ctaKey: z.string() });
try { z.object({ slides: z.array(Slide) }).parse(fixture); } catch (e) { console.error('Invalid HeroBanner fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;
export const RTL = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] }) satisfies Story;

