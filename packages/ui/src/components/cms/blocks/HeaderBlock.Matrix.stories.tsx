// packages/ui/src/components/cms/blocks/HeaderBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import HeaderBlock from './HeaderBlock';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './HeaderBlock.fixtures.json';
import { z } from 'zod';
import type { Locale } from '@acme/i18n/locales';

const meta: Meta<typeof HeaderBlock> = {
  title: 'CMS Blocks/HeaderBlock/Matrix',
  component: HeaderBlock,
  tags: ['autodocs'],
  args: { ...fixture },
  parameters: { docs: { description: { component: 'Header wrapper block mapping to the Header organism.' } } },
};
export default meta;

type Story = StoryObj<typeof HeaderBlock>;
const baseArgs = meta.args!;

const NavItem = z.object({ title: z.string(), href: z.string() });
try { z.object({ nav: z.array(NavItem).optional(), shopName: z.string(), locale: z.string(), showSearch: z.boolean().optional() }).parse(fixture); } catch (e) { console.error('Invalid HeaderBlock fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, { locale: 'ar' as unknown as Locale }, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
