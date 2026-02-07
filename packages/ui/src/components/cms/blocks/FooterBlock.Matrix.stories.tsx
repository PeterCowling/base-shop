// packages/ui/src/components/cms/blocks/FooterBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import type { Locale } from '@acme/i18n/locales';

import { makeStateStory } from '../../../story-utils/createStories';

import FooterBlock from './FooterBlock';
import fixture from './FooterBlock.fixtures.json';

const meta: Meta<typeof FooterBlock> = {
  title: 'CMS Blocks/FooterBlock/Matrix',
  component: FooterBlock,
  args: { ...fixture, locale: 'en' },
};
export default meta;

type Story = StoryObj<typeof FooterBlock>;
const baseArgs = meta.args!;

const Link = z.object({ href: z.string(), label: z.string() });
try { z.object({ links: z.array(Link).optional(), shopName: z.string() }).parse(fixture); } catch (e) { console.error('Invalid FooterBlock fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, { locale: 'ar' as unknown as Locale }, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });

export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
