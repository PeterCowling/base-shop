// packages/ui/src/components/cms/blocks/RentalTermsSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import RentalTermsSection from './RentalTermsSection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './RentalTermsSection.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/RentalTermsSection/Matrix',
  component: RentalTermsSection,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
} satisfies Meta<typeof RentalTermsSection>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

try { z.object({ sku: z.string(), termsVersion: z.string() }).parse(fixture); } catch (e) { console.error('Invalid RentalTermsSection fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

