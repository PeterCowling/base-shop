import type { Meta, StoryObj } from '@storybook/react';
import DynamicRenderer from './DynamicRenderer';
import type { PageComponent } from '@acme/types';

const meta = {
  component: DynamicRenderer,
  tags: ['autodocs'],
  args: {
    locale: 'en',
    components: [
      { id: 'h1', type: 'Heading', text: 'Hello Storybook', margin: '16px 0' } as unknown as PageComponent,
      { id: 'p1', type: 'Text', text: 'This is a DynamicRenderer demo block.' } as unknown as PageComponent,
    ],
  },
  parameters: {
    docs: {
      description: {
        component:
          'Renders a list of PageBuilder components using the registered CMS block registry. This lightweight story feeds a Heading and Text block.',
      },
    },
  },
} satisfies Meta<typeof DynamicRenderer>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

