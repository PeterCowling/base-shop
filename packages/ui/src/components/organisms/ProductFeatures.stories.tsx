import { type Meta, type StoryObj } from "@storybook/nextjs";
import { ProductFeatures } from "./ProductFeatures";

const meta: Meta<typeof ProductFeatures> = {
  component: ProductFeatures,
  args: {
    features: ["Responsive", "Lightweight", "Customizable"],
  },
};
export default meta;

export const Default: StoryObj<typeof ProductFeatures> = {};
