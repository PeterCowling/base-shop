// packages/ui/src/components/cms/blocks/SearchBar.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import SearchBar from './SearchBar';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './SearchBar.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/SearchBar/Matrix',
  component: SearchBar,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
} satisfies Meta<typeof SearchBar>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

const TT = z.union([z.string(), z.object({ type: z.literal('inline'), value: z.string(), locale: z.string().optional() }), z.object({ type: z.literal('key'), key: z.string(), params: z.record(z.any()).optional() })]);
try { z.object({ placeholder: TT.optional(), limit: z.number().optional(), locale: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid SearchBar fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;
export const RTL = makeStateStory(baseArgs, { locale: 'ar' as unknown as import('@acme/types').Locale }, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] }) satisfies Story;
