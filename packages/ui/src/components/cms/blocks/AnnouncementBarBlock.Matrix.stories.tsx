// packages/ui/src/components/cms/blocks/AnnouncementBarBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import AnnouncementBarBlock from './AnnouncementBarBlock';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './AnnouncementBarBlock.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof AnnouncementBarBlock> = {
  title: 'CMS Blocks/AnnouncementBarBlock/Matrix',
  component: AnnouncementBarBlock,
  tags: ['autodocs'],
  args: { ...fixture },
  parameters: { docs: { description: { component: 'Site-wide announcement bar with optional link and close control.' } } },
};
export default meta;

type Story = StoryObj<typeof AnnouncementBarBlock>;
const baseArgs = meta.args!;

const TT = z.union([z.string(), z.object({ type: z.literal('inline'), value: z.string(), locale: z.string().optional() }), z.object({ type: z.literal('key'), key: z.string(), params: z.record(z.any()).optional() })]);
try { z.object({ text: TT, link: z.string().optional(), closable: z.boolean().optional(), locale: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid AnnouncementBarBlock fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
