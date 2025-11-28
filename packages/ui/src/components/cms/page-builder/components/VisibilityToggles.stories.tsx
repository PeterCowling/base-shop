import type { Meta, StoryObj } from '@storybook/nextjs';
import VisibilityToggles from './VisibilityToggles';

const meta: Meta<typeof VisibilityToggles> = {
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
};
export default meta;

export const Default: StoryObj<typeof VisibilityToggles> = {};

