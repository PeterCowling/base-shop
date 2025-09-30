import type { Meta, StoryObj } from '@storybook/react';
import ProfileForm from './ProfileForm';

const meta = {
  component: ProfileForm,
  tags: ['autodocs'],
  args: { name: 'Ada Lovelace', email: 'ada@example.com' },
  parameters: {
    docs: { description: { component: 'Editable profile form with basic client-side validation and submission. This story showcases prefilled and empty states.' } },
  },
} satisfies Meta<typeof ProfileForm>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Prefilled = {} satisfies Story;

export const Empty = {
  args: { name: '', email: '' },
  parameters: {
    docs: { description: { story: 'Empty form demonstrating required field errors when submitted.' } },
  },
} satisfies Story;

