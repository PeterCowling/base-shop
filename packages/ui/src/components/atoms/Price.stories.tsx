import { type Meta, type StoryObj } from "@storybook/react";
import { Price } from "./Price";

const meta = {
  component: Price,
  args: {
    amount: 19.99,
    currency: "USD",
  },
} satisfies Meta<typeof Price>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
