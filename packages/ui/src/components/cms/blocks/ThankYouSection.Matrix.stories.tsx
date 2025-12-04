// packages/ui/src/components/cms/blocks/ThankYouSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import ThankYouSection from './ThankYouSection';
import { makeStateStory } from '../../../story-utils/createStories';

const meta: Meta<typeof ThankYouSection> = {
  title: 'CMS Blocks/ThankYouSection/Matrix',
  component: ThankYouSection,
};
export default meta;

type Story = StoryObj<typeof ThankYouSection>;
export const Default: Story = makeStateStory({}, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory({}, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });

export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
