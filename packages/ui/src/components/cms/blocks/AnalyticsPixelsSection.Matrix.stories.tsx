// packages/ui/src/components/cms/blocks/AnalyticsPixelsSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import AnalyticsPixelsSection from './AnalyticsPixelsSection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './AnalyticsPixelsSection.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/AnalyticsPixelsSection/Matrix',
  component: AnalyticsPixelsSection,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
} satisfies Meta<typeof AnalyticsPixelsSection>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

try { z.object({ measurementId: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid AnalyticsPixelsSection fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

