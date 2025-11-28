import type { Meta, StoryObj } from '@storybook/nextjs';
import GridContainer from './GridContainer';

const meta: Meta<typeof GridContainer> = {
  title: 'CMS Blocks/Containers/GridContainer',
  component: GridContainer,
  parameters: {
    docs: {
      description: {
        component: 'CSS grid container with responsive column/row settings and gaps; useful for ad-hoc block layouts.',
      },
    },
  },
  args: {
    columns: 3,
    gap: '1rem',
    children: [1, 2, 3, 4, 5, 6].map((n) => (
      <div key={n} className="h-16 rounded bg-neutral-100 p-2">Cell {n}</div>
    )),
  },
};
export default meta;

export const Default: StoryObj<typeof GridContainer> = {};
