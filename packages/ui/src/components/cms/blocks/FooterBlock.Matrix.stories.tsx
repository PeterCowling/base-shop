// packages/ui/src/components/cms/blocks/FooterBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import FooterBlock from './FooterBlock';
import type { Locale } from '@acme/i18n/locales';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './FooterBlock.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/FooterBlock/Matrix',
  component: FooterBlock,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture, locale: 'en' },
} satisfies Meta<typeof FooterBlock>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

const Link = z.object({ href: z.string(), label: z.string() });
try { z.object({ links: z.array(Link).optional(), shopName: z.string() }).parse(fixture); } catch (e) { console.error('Invalid FooterBlock fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;
export const RTL = makeStateStory(baseArgs, { locale: 'ar' as unknown as Locale }, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] }) satisfies Story;
