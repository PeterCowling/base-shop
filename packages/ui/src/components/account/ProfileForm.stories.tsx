import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse, delay } from 'msw';
import ProfileForm from './ProfileForm';

const profileUpdateSuccessHandler = http.put('/api/account/profile', async () => {
  await delay(150);
  return HttpResponse.json({ ok: true });
});

const profileUpdateConflictHandler = http.put('/api/account/profile', async () => {
  await delay(150);
  return HttpResponse.json({ error: 'Email already in use' }, { status: 409, statusText: 'Conflict' });
});

const meta: Meta<typeof ProfileForm> = {
  component: ProfileForm,
  tags: ['autodocs'],
  args: { name: 'Ada Lovelace', email: 'ada@example.com' },
  parameters: {
    msw: {
      handlers: [profileUpdateSuccessHandler],
    },
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

export const Conflict: StoryObj<typeof ProfileForm> = {
  parameters: {
    msw: {
      handlers: [profileUpdateConflictHandler],
    },
    docs: {
      description: {
        story: 'Simulates the API returning a conflict when the submitted email already exists.',
      },
    },
  },
};

export const profileFormHandlers = {
  success: profileUpdateSuccessHandler,
  conflict: profileUpdateConflictHandler,
};

