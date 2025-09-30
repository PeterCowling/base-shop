// packages/ui/src/components/cms/blocks/DSARSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import DSARSection from './DSARSection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './DSARSection.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof DSARSection> = {
  title: 'CMS Blocks/DSARSection/Matrix',
  component: DSARSection,
  parameters: { docs: { autodocs: false } },
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

