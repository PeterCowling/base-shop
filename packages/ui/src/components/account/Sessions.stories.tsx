import type { Meta, StoryObj } from "@storybook/react";

import Sessions from "./Sessions";

const meta: Meta<typeof Sessions> = {
  title: "Account/Sessions",
  component: Sessions,
  args: {
    sessions: [
      {
        id: "sess-1",
        device: "MacBook Pro",
        location: "London, UK",
        current: true,
      },
      {
        id: "sess-2",
        device: "iPhone 15",
        location: "New York, US",
        current: false,
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof Sessions>;

export const Default: Story = {};
