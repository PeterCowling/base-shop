// packages/ui/src/components/cms/blocks/AnalyticsPixelsSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import AnalyticsPixelsSection from './AnalyticsPixelsSection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './AnalyticsPixelsSection.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof AnalyticsPixelsSection> = {
  title: 'CMS Blocks/AnalyticsPixelsSection/Matrix',
  component: AnalyticsPixelsSection,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof AnalyticsPixelsSection>;
const baseArgs = meta.args!;

try { z.object({ measurementId: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid AnalyticsPixelsSection fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

