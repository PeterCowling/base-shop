// packages/ui/src/components/cms/blocks/RentalAvailabilitySection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import RentalAvailabilitySection from './RentalAvailabilitySection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './RentalAvailabilitySection.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof RentalAvailabilitySection> = {
  title: 'CMS Blocks/RentalAvailabilitySection/Matrix',
  component: RentalAvailabilitySection,
  tags: ['autodocs'],
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof RentalAvailabilitySection>;
const baseArgs = meta.args!;

try { z.object({ sku: z.string(), locationId: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid RentalAvailabilitySection fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

