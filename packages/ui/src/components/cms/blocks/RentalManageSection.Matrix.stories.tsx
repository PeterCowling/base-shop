// packages/ui/src/components/cms/blocks/RentalManageSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import RentalManageSection from './RentalManageSection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './RentalManageSection.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof RentalManageSection> = {
  title: 'CMS Blocks/RentalManageSection/Matrix',
  component: RentalManageSection,
  parameters: { docs: { autodocs: false } },
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

