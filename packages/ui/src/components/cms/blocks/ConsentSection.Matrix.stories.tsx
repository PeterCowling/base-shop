// packages/ui/src/components/cms/blocks/ConsentSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import ConsentSection from './ConsentSection';
import { makeStateStory } from '../../../story-utils/createStories';

const meta: Meta<typeof ConsentSection> = {
  title: 'CMS Blocks/ConsentSection/Matrix',
  component: ConsentSection,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof ConsentSection>;
export const Default: Story = makeStateStory({}, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

