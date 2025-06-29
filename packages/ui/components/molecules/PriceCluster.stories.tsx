import { type Meta, type StoryObj } from "@storybook/react";
import { PriceCluster } from "./PriceCluster";

const meta: Meta<typeof PriceCluster> = {
  component: PriceCluster,
  args: {
    price: 80,
    compare: 100,
    currency: "EUR",
  },
  argTypes: {
    price: { control: "number" },
    compare: { control: "number" },
    currency: { control: "text" },
  },
};
export default meta;

export const Default: StoryObj<typeof PriceCluster> = {};
