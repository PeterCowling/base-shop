import { type Meta, type StoryObj } from "@storybook/react";
import { PriceCluster } from "./PriceCluster";

const meta = {
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
} satisfies Meta<typeof PriceCluster>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
