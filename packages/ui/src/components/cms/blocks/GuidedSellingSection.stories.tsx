import type { Meta, StoryObj } from "@storybook/react";
import GuidedSellingSection from "./GuidedSellingSection";

const meta = {
  component: GuidedSellingSection,
  args: {
    outputMode: "inline",
  },
} satisfies Meta<typeof GuidedSellingSection>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

