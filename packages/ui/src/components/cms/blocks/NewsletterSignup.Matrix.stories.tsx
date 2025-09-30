// packages/ui/src/components/cms/blocks/NewsletterSignup.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import NewsletterSignup from './NewsletterSignup';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './NewsletterSignup.fixtures.json';
import { z } from 'zod';
import type { Locale } from '@acme/i18n/locales';

const meta: Meta<typeof NewsletterSignup> = {
  title: 'CMS Blocks/NewsletterSignup/Matrix',
  component: NewsletterSignup,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
  parameters: { docs: { description: { component: 'Newsletter signup form with translatable placeholder/label text.' } } },
};
export default meta;

type Story = StoryObj<typeof NewsletterSignup>;
const baseArgs = meta.args!;

const TT = z.union([
  z.string(),
  z.object({ type: z.literal('inline'), value: z.string(), locale: z.string().optional() }),
  z.object({ type: z.literal('key'), key: z.string(), params: z.record(z.unknown()).optional() }),
]);
try { z.object({ action: z.string().optional(), placeholder: TT.optional(), submitLabel: TT.optional(), text: TT.optional(), locale: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid NewsletterSignup fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, { locale: 'ar' as unknown as Locale }, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
