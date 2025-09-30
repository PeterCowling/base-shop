// packages/ui/src/components/cms/blocks/CrossSellSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import CrossSellSection from './CrossSellSection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './CrossSellSection.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof CrossSellSection> = {
  title: 'CMS Blocks/CrossSellSection/Matrix',
  component: CrossSellSection,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof CrossSellSection>;
const baseArgs = meta.args!;

try { z.object({ rules: z.object({ seedId: z.string().optional(), includeForRental: z.boolean().optional(), onlyInStock: z.boolean().optional(), maxItems: z.number().optional() }).optional(), layout: z.enum(['grid','carousel']).optional() }).parse(fixture); } catch (e) { console.error('Invalid CrossSellSection fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const Carousel: Story = makeStateStory(baseArgs, { layout: 'carousel' }, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

