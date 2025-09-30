import { type Meta, type StoryObj } from "@storybook/react";
import { ProductFeatures } from "./ProductFeatures";

const meta = {
  component: ProductFeatures,
  args: {
    features: ["Responsive", "Lightweight", "Customizable"],
  },
} satisfies Meta<typeof ProductFeatures>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
