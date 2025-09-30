// packages/ui/src/components/cms/blocks/PoliciesAccordion.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import PoliciesAccordion from './PoliciesAccordion';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './PoliciesAccordion.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/PoliciesAccordion/Matrix',
  component: PoliciesAccordion,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
} satisfies Meta<typeof PoliciesAccordion>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

try { z.object({ shipping: z.string().optional(), returns: z.string().optional(), warranty: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid PoliciesAccordion fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

