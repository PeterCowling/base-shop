import type { Meta, StoryObj } from '@storybook/react';
import CarouselContainer from './CarouselContainer';

const meta = {
  title: 'CMS Blocks/Containers/CarouselContainer',
  component: CarouselContainer,
  parameters: {
    docs: {
      description: {
        component: 'Simple horizontal carousel wrapper used by CMS blocks. Controls slides-per-view and gaps.',
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


export const Default = {} satisfies Story;
