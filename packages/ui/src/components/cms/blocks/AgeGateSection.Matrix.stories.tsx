// packages/ui/src/components/cms/blocks/AgeGateSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import AgeGateSection from './AgeGateSection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './AgeGateSection.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof AgeGateSection> = {
  title: 'CMS Blocks/AgeGateSection/Matrix',
  component: AgeGateSection,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof AgeGateSection>;
const baseArgs = meta.args!;

try { z.object({ minAge: z.number().optional(), message: z.string().optional(), confirmLabel: z.string().optional(), storageKey: z.string().optional(), rememberDays: z.number().optional() }).parse(fixture); } catch (e) { console.error('Invalid AgeGateSection fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

