// packages/ui/src/components/cms/blocks/FooterBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import FooterBlock from './FooterBlock';
import type { Locale } from '@acme/i18n/locales';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './FooterBlock.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof FooterBlock> = {
  title: 'CMS Blocks/FooterBlock/Matrix',
  component: FooterBlock,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture, locale: 'en' },
};
export default meta;

type Story = StoryObj<typeof FooterBlock>;
const baseArgs = meta.args!;

const Link = z.object({ href: z.string(), label: z.string() });
try { z.object({ links: z.array(Link).optional(), shopName: z.string() }).parse(fixture); } catch (e) { console.error('Invalid FooterBlock fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, { locale: 'ar' as unknown as Locale }, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
