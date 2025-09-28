// packages/ui/src/components/cms/blocks/StructuredDataSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import StructuredDataSection from './StructuredDataSection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './StructuredDataSection.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof StructuredDataSection> = {
  title: 'CMS Blocks/StructuredDataSection/Matrix',
  component: StructuredDataSection,
  tags: ['autodocs'],
  args: { ...fixture },
  parameters: { docs: { description: { component: 'Emits JSON-LD for breadcrumbs/FAQ/organization/local business based on flags.' } } },
};
export default meta;

type Story = StoryObj<typeof StructuredDataSection>;
const baseArgs = meta.args!;

try { z.object({ breadcrumbs: z.boolean().optional(), faq: z.boolean().optional(), organization: z.boolean().optional(), orgName: z.string().optional(), orgSameAs: z.array(z.string()).optional(), localBusiness: z.boolean().optional(), local: z.record(z.any()).optional() }).parse(fixture); } catch (e) { console.error('Invalid StructuredDataSection fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

