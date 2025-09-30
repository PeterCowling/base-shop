import type { Meta, StoryObj } from "@storybook/react";
import { SustainabilityBadgeCluster } from "./SustainabilityBadgeCluster";

const meta = {
  component: SustainabilityBadgeCluster,
  args: {
    badges: [
      { label: "Eco", variant: "new" },
      { label: "Fair Trade", variant: "default" },
    ],
  },
} satisfies Meta<typeof SustainabilityBadgeCluster>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
