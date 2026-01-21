import type { Meta, StoryObj } from "@storybook/react";

import AccountNavigation from "./AccountNavigation";

const meta: Meta<typeof AccountNavigation> = {
  title: "Account/AccountNavigation",
  component: AccountNavigation,
  args: {
    ariaLabel: "Account navigation",
    currentPath: "/account/orders",
    items: [
      { href: "/account/profile", label: "Profile" },
      { href: "/account/orders", label: "Orders" },
      { href: "/account/security", label: "Security" },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof AccountNavigation>;

export const Default: Story = {};
