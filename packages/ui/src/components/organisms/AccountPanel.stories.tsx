import type { Meta, StoryObj } from "@storybook/nextjs";
import { AccountPanel } from "./AccountPanel";

const meta: Meta<typeof AccountPanel> = {
  component: AccountPanel,
  args: {
    user: { name: "Ada Lovelace", email: "ada@example.com" },
  },
};
export default meta;

export const Default: StoryObj<typeof AccountPanel> = {};
