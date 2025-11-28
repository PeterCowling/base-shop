// packages/ui/src/components/cms/blocks/CheckoutSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import CheckoutSection from './CheckoutSection';
import type { Locale } from '@acme/i18n/locales';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './CheckoutSection.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof CheckoutSection> = {
  title: 'CMS Blocks/CheckoutSection/Matrix',
  component: CheckoutSection,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof CheckoutSection>;
const baseArgs = meta.args!;

try { z.object({ locale: z.string(), taxRegion: z.string().optional(), showWallets: z.boolean().optional(), showBNPL: z.boolean().optional() }).parse(fixture); } catch (e) { console.error('Invalid CheckoutSection fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, { locale: 'ar' as Locale }, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
