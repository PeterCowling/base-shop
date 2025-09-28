// packages/ui/src/components/cms/blocks/Lookbook.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import Lookbook from './Lookbook';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './Lookbook.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof Lookbook> = {
  title: 'CMS Blocks/Lookbook/Matrix',
  component: Lookbook,
  tags: ['autodocs'],
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof Lookbook>;
const baseArgs = meta.args!;

const Hotspot = z.object({ x: z.number(), y: z.number(), sku: z.string().optional() });
const Item = z.object({ src: z.string().optional(), alt: z.string().optional(), hotspots: z.array(Hotspot).optional() });
try { z.object({ items: z.array(Item) }).parse(fixture); } catch (e) { console.error('Invalid Lookbook fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

