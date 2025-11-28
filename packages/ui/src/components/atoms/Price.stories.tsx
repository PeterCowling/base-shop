import { type Meta, type StoryObj } from "@storybook/nextjs";
import { Price } from "./Price";

const meta: Meta<typeof Price> = {
  component: Price,
  args: {
    amount: 19.99,
    currency: "USD",
  },
};
export default meta;

export const Default: StoryObj<typeof Price> = {};
