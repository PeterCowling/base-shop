// packages/ui/src/components/cms/blocks/FooterSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '@acme/ui/story-utils/createStories';

import FooterSection from './FooterSection';
import fixture from './FooterSection.fixtures.json';

const meta: Meta<typeof FooterSection> = {
  title: 'CMS Blocks/FooterSection/Matrix',
  component: FooterSection,
  parameters: { docs: { autodocs: false }, description: { component: 'Footer section with configurable variants (simple, multiColumn, newsletter, social, legalHeavy).' } },
  args: { variant: 'simple' },
};
export default meta;

type Story = StoryObj<typeof FooterSection>;
const baseArgs = meta.args!;

const FixtureSchema = z.object({ variant: z.enum(['simple','multiColumn','legalHeavy','newsletter','social']).optional() });
try { FixtureSchema.parse(fixture); } catch (e) { console.error('Invalid FooterSection fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, { variant: 'multiColumn' }, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });

export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
