// packages/ui/src/components/cms/blocks/containers/CarouselContainer.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';

import { makeStateStory } from '../../../story-utils/createStories';

import CarouselContainer from './CarouselContainer';

const meta: Meta<typeof CarouselContainer> = {
  title: 'CMS Blocks/Containers/CarouselContainer/Matrix',
  component: CarouselContainer,
  parameters: {
    docs: {
      description: {
        component: `Generic horizontal carousel container with optional arrows/dots and responsive slides/gaps.\n\nUsage:\n\n\`\`\`tsx\nimport CarouselContainer from './CarouselContainer';\n\n<CarouselContainer slidesPerView={2} gap="1rem">\n  <div>Slide 1</div>\n  <div>Slide 2</div>\n  <div>Slide 3</div>\n</CarouselContainer>\n\n// Key args: slidesPerView (+Desktop/Tablet/Mobile), gap (+Desktop/Tablet/Mobile), showArrows, showDots\n\`\`\``,
      },
    },
  },
  args: {
    slidesPerView: 2,
    children: [1, 2, 3].map((n) => (
      <div key={n} className="h-24 w-40 rounded bg-muted p-3">Slide {n}</div>
    )),
  },
};
export default meta;

type Story = StoryObj<typeof CarouselContainer>;
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Basic horizontal carousel with arrows and dots.',
});

export const Loading: Story = makeStateStory(baseArgs, { showDots: false }, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Simulated loading: dots hidden to minimize UI.',
});

export const Empty: Story = makeStateStory(baseArgs, { children: [] as React.ReactNode[] }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'No slides; container renders without controls.',
});

export const Error: Story = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
  docsDescription: 'Matrix completeness state; non-networked component.',
});

export const RTL: Story = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'RTL sample; navigation controls adapt to direction.',
});
