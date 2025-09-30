// packages/ui/src/components/cms/blocks/AnnouncementBarBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import AnnouncementBarBlock from './AnnouncementBarBlock';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './AnnouncementBarBlock.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/AnnouncementBarBlock/Matrix',
  component: AnnouncementBarBlock,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
  parameters: { docs: { description: { component: 'Site-wide announcement bar with optional link and close control.' } } },
} satisfies Meta<typeof AnnouncementBarBlock>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

const TT = z.union([z.string(), z.object({ type: z.literal('inline'), value: z.string(), locale: z.string().optional() }), z.object({ type: z.literal('key'), key: z.string(), params: z.record(z.any()).optional() })]);
try { z.object({ text: TT, link: z.string().optional(), closable: z.boolean().optional(), locale: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid AnnouncementBarBlock fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;
export const RTL = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] }) satisfies Story;
