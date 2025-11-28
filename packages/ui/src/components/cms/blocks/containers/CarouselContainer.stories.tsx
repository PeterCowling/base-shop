import type { Meta, StoryObj } from '@storybook/nextjs';
import CarouselContainer from './CarouselContainer';

const meta: Meta<typeof CarouselContainer> = {
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
};
export default meta;

export const Default: StoryObj<typeof CarouselContainer> = {};
