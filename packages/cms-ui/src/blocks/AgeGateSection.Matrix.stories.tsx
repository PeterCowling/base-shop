// packages/ui/src/components/cms/blocks/AgeGateSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '../../../story-utils/createStories';

import AgeGateSection from './AgeGateSection';
import fixture from './AgeGateSection.fixtures.json';

const meta: Meta<typeof AgeGateSection> = {
  title: 'CMS Blocks/AgeGateSection/Matrix',
  component: AgeGateSection,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof AgeGateSection>;
const baseArgs = meta.args!;

try { z.object({ minAge: z.number().optional(), message: z.string().optional(), confirmLabel: z.string().optional(), storageKey: z.string().optional(), rememberDays: z.number().optional() }).parse(fixture); } catch (e) { console.error('Invalid AgeGateSection fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
