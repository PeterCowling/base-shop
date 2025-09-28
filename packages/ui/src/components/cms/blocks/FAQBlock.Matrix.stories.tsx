// packages/ui/src/components/cms/blocks/FAQBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import FAQBlock from './FAQBlock';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './FAQBlock.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof FAQBlock> = {
  title: 'CMS Blocks/FAQBlock/Matrix',
  component: FAQBlock,
  tags: ['autodocs'],
  args: { items: fixture.items },
  parameters: { docs: { description: { component: 'Frequently asked questions list.' } } },
};
export default meta;

type Story = StoryObj<typeof FAQBlock>;
const baseArgs = meta.args!;

try { z.object({ items: z.array(z.object({ q: z.string(), a: z.string() })) }).parse(fixture); } catch (e) { console.error('Invalid FAQBlock fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });

