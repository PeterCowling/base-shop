import type { Meta, StoryObj } from '@storybook/nextjs';
import ProfileForm from './ProfileForm';

const meta: Meta<typeof ProfileForm> = {
  component: ProfileForm,
  tags: ['autodocs'],
  args: { name: 'Ada Lovelace', email: 'ada@example.com' },
  parameters: {
    docs: { description: { component: 'Editable profile form with basic client-side validation and submission. This story showcases prefilled and empty states.' } },
  },
};
export default meta;

export const Prefilled: StoryObj<typeof ProfileForm> = {};

export const Empty: StoryObj<typeof ProfileForm> = {
  args: { name: '', email: '' },
  parameters: {
    docs: { description: { story: 'Empty form demonstrating required field errors when submitted.' } },
  },
};

