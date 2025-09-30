import type { Meta, StoryObj } from "@storybook/react";
import { AccountPanel } from "./AccountPanel";

const meta = {
  component: AccountPanel,
  args: {
    user: { name: "Ada Lovelace", email: "ada@example.com" },
  },
} satisfies Meta<typeof AccountPanel>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
