// packages/ui/src/components/cms/blocks/EmailReferralSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import type { Locale } from '@acme/types';
import { makeStateStory } from '@acme/ui/story-utils/createStories';

import EmailReferralSection from './EmailReferralSection';
import fixture from './EmailReferralSection.fixtures.json';

const meta: Meta<typeof EmailReferralSection> = {
  title: 'CMS Blocks/EmailReferralSection/Matrix',
  component: EmailReferralSection,
  args: { ...fixture },
  parameters: { docs: { description: { component: 'Refer-a-friend section with translatable labels and optional adapter to submit.' } } },
};
export default meta;

type Story = StoryObj<typeof EmailReferralSection>;
const baseArgs = meta.args!;

const TT = z.union([z.string(), z.object({ type: z.literal('inline'), value: z.string(), locale: z.string().optional() }), z.object({ type: z.literal('key'), key: z.string(), params: z.record(z.any()).optional() })]);
try { z.object({ headline: TT.optional(), subtitle: TT.optional(), giveLabel: TT.optional(), getLabel: TT.optional(), termsHref: z.string().optional(), locale: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid EmailReferralSection fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, { locale: 'ar' as Locale }, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });

export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
