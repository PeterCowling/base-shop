// packages/ui/src/components/cms/blocks/RentalTermsSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '@acme/ui/story-utils/createStories';

import RentalTermsSection from './RentalTermsSection';
import fixture from './RentalTermsSection.fixtures.json';

const meta: Meta<typeof RentalTermsSection> = {
  title: 'CMS Blocks/RentalTermsSection/Matrix',
  component: RentalTermsSection,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof RentalTermsSection>;
const baseArgs = meta.args!;

try { z.object({ sku: z.string(), termsVersion: z.string() }).parse(fixture); } catch (e) { console.error('Invalid RentalTermsSection fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
