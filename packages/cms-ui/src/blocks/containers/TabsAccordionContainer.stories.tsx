import type { Meta, StoryObj } from '@storybook/nextjs';

import TabsAccordionContainer from './TabsAccordionContainer';

const meta: Meta<typeof TabsAccordionContainer> = {
  title: 'CMS Blocks/Containers/TabsAccordionContainer',
  component: TabsAccordionContainer,
  parameters: {
    docs: {
      description: {
        component: 'Presents child panels as tabs or an accordion; good for compact CMS content sections.',
      },
    },
  },
  args: {
    mode: 'tabs',
    tabs: ['One', 'Two', 'Three'],
    children: [
      <div key={1} className="p-3">Tab One Content</div>,
      <div key={2} className="p-3">Tab Two Content</div>,
      <div key={3} className="p-3">Tab Three Content</div>,
    ],
  },
};
export default meta;

export const Default: StoryObj<typeof TabsAccordionContainer> = {};
