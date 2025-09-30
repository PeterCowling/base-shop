// packages/ui/src/components/cms/blocks/FAQBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import FAQBlock from './FAQBlock';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './FAQBlock.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/FAQBlock/Matrix',
  component: FAQBlock,
  parameters: { docs: { autodocs: false } },
  args: { items: fixture.items },
  parameters: { docs: { description: { component: 'Frequently asked questions list.' } } },
} satisfies Meta<typeof FAQBlock>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

try { z.object({ items: z.array(z.object({ q: z.string(), a: z.string() })) }).parse(fixture); } catch (e) { console.error('Invalid FAQBlock fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;
export const RTL = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] }) satisfies Story;

