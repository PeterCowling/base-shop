// packages/ui/src/components/cms/blocks/HeaderBlock.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import HeaderBlock from './HeaderBlock';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './HeaderBlock.fixtures.json';
import { z } from 'zod';
import type { Locale } from '@acme/i18n/locales';

const meta = {
  title: 'CMS Blocks/HeaderBlock/Matrix',
  component: HeaderBlock,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
  parameters: { docs: { description: { component: 'Header wrapper block mapping to the Header organism.' } } },
} satisfies Meta<typeof HeaderBlock>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

const NavItem = z.object({ title: z.string(), href: z.string() });
try { z.object({ nav: z.array(NavItem).optional(), shopName: z.string(), locale: z.string(), showSearch: z.boolean().optional() }).parse(fixture); } catch (e) { console.error('Invalid HeaderBlock fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;
export const RTL = makeStateStory(baseArgs, { locale: 'ar' as unknown as Locale }, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] }) satisfies Story;
