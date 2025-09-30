// packages/ui/src/components/cms/blocks/ConsentSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import ConsentSection from './ConsentSection';
import { makeStateStory } from '../../../story-utils/createStories';

const meta = {
  title: 'CMS Blocks/ConsentSection/Matrix',
  component: ConsentSection,
  parameters: { docs: { autodocs: false } },
} satisfies Meta<typeof ConsentSection>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = makeStateStory({}, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

