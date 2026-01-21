// packages/ui/src/components/cms/blocks/DSARSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '../../../story-utils/createStories';

import DSARSection from './DSARSection';
import fixture from './DSARSection.fixtures.json';

const meta: Meta<typeof DSARSection> = {
  title: 'CMS Blocks/DSARSection/Matrix',
  component: DSARSection,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof DSARSection>;
const baseArgs = meta.args!;

try { z.object({ headline: z.string().optional(), explanation: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid DSARSection fixture:', e); }

const okAdapter = async () => ({ ok: true, message: 'We will email your data shortly.' });
const failAdapter = async () => ({ ok: false, message: 'Unable to process request.' });

export const Default: Story = makeStateStory(baseArgs, { adapter: okAdapter }, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const ErrorState: Story = makeStateStory(baseArgs, { adapter: failAdapter }, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
