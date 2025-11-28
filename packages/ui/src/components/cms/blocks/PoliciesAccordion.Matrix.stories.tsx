// packages/ui/src/components/cms/blocks/PoliciesAccordion.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import PoliciesAccordion from './PoliciesAccordion';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './PoliciesAccordion.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof PoliciesAccordion> = {
  title: 'CMS Blocks/PoliciesAccordion/Matrix',
  component: PoliciesAccordion,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof PoliciesAccordion>;
const baseArgs = meta.args!;

try { z.object({ shipping: z.string().optional(), returns: z.string().optional(), warranty: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid PoliciesAccordion fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

