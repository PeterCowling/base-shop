// packages/ui/src/components/cms/blocks/HeroBanner.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import CmsHeroBanner from './HeroBanner';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './HeroBanner.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof CmsHeroBanner> = {
  title: 'CMS Blocks/HeroBanner/Matrix',
  component: CmsHeroBanner,
  parameters: { docs: { autodocs: false } },
  args: { slides: fixture.slides },
};
export default meta;

type Story = StoryObj<typeof CmsHeroBanner>;
const baseArgs = meta.args!;

const Slide = z.object({ src: z.string(), altKey: z.string().optional(), headlineKey: z.string(), ctaKey: z.string() });
try { z.object({ slides: z.array(Slide) }).parse(fixture); } catch (e) { console.error('Invalid HeroBanner fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });

