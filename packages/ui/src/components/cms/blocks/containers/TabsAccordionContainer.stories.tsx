import type { Meta, StoryObj } from '@storybook/react';
import TabsAccordionContainer from './TabsAccordionContainer';

const meta = {
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
} satisfies Meta<typeof TabsAccordionContainer>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
