// packages/ui/src/components/cms/blocks/containers/CarouselContainer.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import CarouselContainer from './CarouselContainer';
import { makeStateStory } from '../../../story-utils/createStories';

const meta = {
  title: 'CMS Blocks/Containers/CarouselContainer/Matrix',
  component: CarouselContainer,
  parameters: { docs: { autodocs: false } },
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
      <div key={n} className="h-24 w-40 rounded bg-neutral-100 p-3">Slide {n}</div>
    )),
  },
} satisfies Meta<typeof CarouselContainer>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

export const Default = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Basic horizontal carousel with arrows and dots.',
}) satisfies Story;

export const Loading = makeStateStory(baseArgs, { showDots: false }, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Simulated loading: dots hidden to minimize UI.',
}) satisfies Story;

export const Empty = makeStateStory(baseArgs, { children: [] as React.ReactNode[] }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'No slides; container renders without controls.',
}) satisfies Story;

export const Error = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
  docsDescription: 'Matrix completeness state; non-networked component.',
}) satisfies Story;

export const RTL = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'RTL sample; navigation controls adapt to direction.',
}) satisfies Story;
