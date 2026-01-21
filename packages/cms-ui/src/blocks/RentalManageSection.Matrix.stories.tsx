// packages/ui/src/components/cms/blocks/RentalManageSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '../../../story-utils/createStories';

import RentalManageSection from './RentalManageSection';
import fixture from './RentalManageSection.fixtures.json';

const meta: Meta<typeof RentalManageSection> = {
  title: 'CMS Blocks/RentalManageSection/Matrix',
  component: RentalManageSection,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof RentalManageSection>;
const baseArgs = meta.args!;

try { z.object({ rentalId: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid RentalManageSection fixture:', e); }

const okAdapter = async () => ({ ok: true, message: 'Updated' });
const failAdapter = async () => ({ ok: false, message: 'Failed' });

export const Default: Story = makeStateStory(baseArgs, { adapter: okAdapter }, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const ErrorState: Story = makeStateStory(baseArgs, { adapter: failAdapter }, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
