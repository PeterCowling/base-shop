// packages/ui/src/components/cms/blocks/DSARSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import DSARSection from './DSARSection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './DSARSection.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/DSARSection/Matrix',
  component: DSARSection,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
} satisfies Meta<typeof DSARSection>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

try { z.object({ headline: z.string().optional(), explanation: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid DSARSection fixture:', e); }

const okAdapter = async () => ({ ok: true, message: 'We will email your data shortly.' });
const failAdapter = async () => ({ ok: false, message: 'Unable to process request.' });

export const Default = makeStateStory(baseArgs, { adapter: okAdapter }, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;
export const ErrorState = makeStateStory(baseArgs, { adapter: failAdapter }, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

