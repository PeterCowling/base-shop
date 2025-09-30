// packages/ui/src/components/cms/blocks/GuidedSellingSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import GuidedSellingSection from './GuidedSellingSection';
import { makeStateStory } from '../../../story-utils/createStories';

const meta = {
  title: 'CMS Blocks/GuidedSellingSection/Matrix',
  component: GuidedSellingSection,
  parameters: { docs: { autodocs: false } },
} satisfies Meta<typeof GuidedSellingSection>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = makeStateStory({}, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

