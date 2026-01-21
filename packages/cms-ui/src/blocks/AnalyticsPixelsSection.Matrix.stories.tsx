// packages/ui/src/components/cms/blocks/AnalyticsPixelsSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '../../../story-utils/createStories';

import AnalyticsPixelsSection from './AnalyticsPixelsSection';
import fixture from './AnalyticsPixelsSection.fixtures.json';

const meta: Meta<typeof AnalyticsPixelsSection> = {
  title: 'CMS Blocks/AnalyticsPixelsSection/Matrix',
  component: AnalyticsPixelsSection,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof AnalyticsPixelsSection>;
const baseArgs = meta.args!;

try { z.object({ measurementId: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid AnalyticsPixelsSection fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
