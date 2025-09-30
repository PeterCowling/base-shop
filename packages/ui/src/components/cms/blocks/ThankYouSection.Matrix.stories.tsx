// packages/ui/src/components/cms/blocks/ThankYouSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import ThankYouSection from './ThankYouSection';
import { makeStateStory } from '../../../story-utils/createStories';

const meta = {
  title: 'CMS Blocks/ThankYouSection/Matrix',
  component: ThankYouSection,
  parameters: { docs: { autodocs: false } },
} satisfies Meta<typeof ThankYouSection>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = makeStateStory({}, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;
export const RTL = makeStateStory({}, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] }) satisfies Story;
