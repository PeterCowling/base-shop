// packages/ui/src/components/cms/blocks/CheckoutSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import CheckoutSection from './CheckoutSection';
import type { Locale } from '@acme/i18n/locales';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './CheckoutSection.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/CheckoutSection/Matrix',
  component: CheckoutSection,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
} satisfies Meta<typeof CheckoutSection>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

try { z.object({ locale: z.string(), taxRegion: z.string().optional(), showWallets: z.boolean().optional(), showBNPL: z.boolean().optional() }).parse(fixture); } catch (e) { console.error('Invalid CheckoutSection fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;
export const RTL = makeStateStory(baseArgs, { locale: 'ar' as Locale }, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] }) satisfies Story;
