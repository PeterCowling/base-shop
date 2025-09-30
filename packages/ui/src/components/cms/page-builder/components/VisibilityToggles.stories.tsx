import type { Meta, StoryObj } from '@storybook/react';
import VisibilityToggles from './VisibilityToggles';

const meta = {
  component: VisibilityToggles,
  tags: ['autodocs'],
  args: {
    selectedIds: ['a', 'b'],
    editor: { a: { hidden: ['mobile'] }, b: { hidden: [] } } as any,
    dispatch: () => {},
    breakpoints: ['desktop', 'tablet', 'mobile'],
  },
  parameters: {
    docs: {
      description: {
        component: 'Controls per-breakpoint visibility for selected components in the Page Builder.',
      },
    },
  },
} satisfies Meta<typeof VisibilityToggles>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

