// packages/ui/src/components/cms/blocks/Gallery.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import Gallery from './Gallery';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './Gallery.fixtures.json';
import { z } from 'zod';
import type { Locale } from '@acme/i18n/locales';

const meta: Meta<typeof Gallery> = {
  title: 'CMS Blocks/Gallery/Matrix',
  component: Gallery,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof Gallery>;
const baseArgs = meta.args!;

const TT = z.union([
  z.string(),
  z.object({ type: z.literal('inline'), value: z.string(), locale: z.string().optional() }),
  z.object({ type: z.literal('key'), key: z.string(), params: z.record(z.unknown()).optional() }),
]);
const Img = z.object({ src: z.string(), alt: TT.optional(), caption: TT.optional() });
try { z.object({ images: z.array(Img), openInLightbox: z.boolean().optional(), locale: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid Gallery fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, { locale: 'ar' as unknown as Locale }, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });

export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
