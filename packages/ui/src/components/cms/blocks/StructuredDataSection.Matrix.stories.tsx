// packages/ui/src/components/cms/blocks/StructuredDataSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import StructuredDataSection from './StructuredDataSection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './StructuredDataSection.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/StructuredDataSection/Matrix',
  component: StructuredDataSection,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
  parameters: { docs: { description: { component: 'Emits JSON-LD for breadcrumbs/FAQ/organization/local business based on flags.' } } },
} satisfies Meta<typeof StructuredDataSection>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

try { z.object({ breadcrumbs: z.boolean().optional(), faq: z.boolean().optional(), organization: z.boolean().optional(), orgName: z.string().optional(), orgSameAs: z.array(z.string()).optional(), localBusiness: z.boolean().optional(), local: z.record(z.any()).optional() }).parse(fixture); } catch (e) { console.error('Invalid StructuredDataSection fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

