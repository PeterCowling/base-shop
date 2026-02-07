// packages/ui/src/components/cms/blocks/SearchBar.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '../../../story-utils/createStories';

import SearchBar from './SearchBar';
import fixture from './SearchBar.fixtures.json';

const meta: Meta<typeof SearchBar> = {
  title: 'CMS Blocks/SearchBar/Matrix',
  component: SearchBar,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof SearchBar>;
const baseArgs = meta.args!;

const TT = z.union([z.string(), z.object({ type: z.literal('inline'), value: z.string(), locale: z.string().optional() }), z.object({ type: z.literal('key'), key: z.string(), params: z.record(z.any()).optional() })]);
try { z.object({ placeholder: TT.optional(), limit: z.number().optional(), locale: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid SearchBar fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, { locale: 'ar' as unknown as import('@acme/types').Locale }, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });

export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
