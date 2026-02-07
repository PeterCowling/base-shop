import type { Meta, StoryObj } from "@storybook/nextjs";

import GuidedSellingSection from "./GuidedSellingSection";

const meta: Meta<typeof GuidedSellingSection> = {
  title: "CMS Blocks/GuidedSellingSection",
  component: GuidedSellingSection,
  args: {
    outputMode: "inline",
  },
};
export default meta;

export const Default: StoryObj<typeof GuidedSellingSection> = {};

