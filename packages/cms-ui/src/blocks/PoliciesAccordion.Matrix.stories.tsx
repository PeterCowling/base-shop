// packages/ui/src/components/cms/blocks/PoliciesAccordion.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '../../../story-utils/createStories';

import PoliciesAccordion from './PoliciesAccordion';
import fixture from './PoliciesAccordion.fixtures.json';

const meta: Meta<typeof PoliciesAccordion> = {
  title: 'CMS Blocks/PoliciesAccordion/Matrix',
  component: PoliciesAccordion,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof PoliciesAccordion>;
const baseArgs = meta.args!;

try { z.object({ shipping: z.string().optional(), returns: z.string().optional(), warranty: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid PoliciesAccordion fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
