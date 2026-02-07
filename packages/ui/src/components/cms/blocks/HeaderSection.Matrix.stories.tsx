// packages/ui/src/components/cms/blocks/HeaderSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '../../../story-utils/createStories';

import HeaderSection from './HeaderSection';
import fixture from './HeaderSection.fixtures.json';

const meta: Meta<typeof HeaderSection> = {
  title: 'CMS Blocks/HeaderSection/Matrix',
  component: HeaderSection,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof HeaderSection>;
const baseArgs = meta.args!;

try { z.object({ locale: z.string(), shopName: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid HeaderSection fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
