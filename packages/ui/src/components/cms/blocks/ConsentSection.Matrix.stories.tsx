// packages/ui/src/components/cms/blocks/ConsentSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import ConsentSection from './ConsentSection';
import { makeStateStory } from '../../../story-utils/createStories';

const meta: Meta<typeof ConsentSection> = {
  title: 'CMS Blocks/ConsentSection/Matrix',
  component: ConsentSection,
};
export default meta;

type Story = StoryObj<typeof ConsentSection>;
export const Default: Story = makeStateStory({}, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
