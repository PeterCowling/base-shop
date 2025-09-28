import type { Meta, StoryObj } from '@storybook/react';
import ProfileForm from './ProfileForm';

// Demo of the Profile page UI using ProfileForm only.
// The actual Profile page is a server component (auth + data fetching) and is not rendered in Storybook.

function ProfileDemo() {
  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl">Profile</h1>
      <ProfileForm name="Ada Lovelace" email="ada@example.com" />
      <div className="mt-4 text-sm text-muted-foreground">(Change password link would appear for authorized users)</div>
    </div>
  );
}

const meta: Meta<typeof ProfileDemo> = {
  title: 'Account/Profile (Demo)',
  component: ProfileDemo,
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: 'Demo composition of the Profile page UI using ProfileForm. The real page performs auth and loads data on the server.' } },
  },
};
export default meta;

export const Default: StoryObj<typeof ProfileDemo> = {};

