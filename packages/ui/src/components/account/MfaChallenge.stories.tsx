import type { Meta, StoryObj } from "@storybook/react";

import MfaChallenge from "./MfaChallenge";

const meta: Meta<typeof MfaChallenge> = {
  title: "Account/MfaChallenge",
  component: MfaChallenge,
};

export default meta;
type Story = StoryObj<typeof MfaChallenge>;

export const Default: Story = {};

export const WithCustomerId: Story = {
  args: {
    customerId: "cust_123",
  },
};
