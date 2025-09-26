import type { Meta, StoryObj } from "@storybook/react";
import GuidedSellingSection from "./GuidedSellingSection";

const meta: Meta<typeof GuidedSellingSection> = {
  component: GuidedSellingSection,
  args: {
    outputMode: "inline",
  },
};
export default meta;

export const Default: StoryObj<typeof GuidedSellingSection> = {};

