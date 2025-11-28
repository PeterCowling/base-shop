// packages/ui/src/components/cms/blocks/RentalTermsSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import RentalTermsSection from './RentalTermsSection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './RentalTermsSection.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof RentalTermsSection> = {
  title: 'CMS Blocks/RentalTermsSection/Matrix',
  component: RentalTermsSection,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof RentalTermsSection>;
const baseArgs = meta.args!;

try { z.object({ sku: z.string(), termsVersion: z.string() }).parse(fixture); } catch (e) { console.error('Invalid RentalTermsSection fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

