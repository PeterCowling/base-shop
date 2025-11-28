import type { Meta, StoryObj } from "@storybook/nextjs";
import { SustainabilityBadgeCluster } from "./SustainabilityBadgeCluster";

const meta: Meta<typeof SustainabilityBadgeCluster> = {
  component: SustainabilityBadgeCluster,
  args: {
    badges: [
      { label: "Eco", variant: "new" },
      { label: "Fair Trade", variant: "default" },
    ],
  },
};
export default meta;

export const Default: StoryObj<typeof SustainabilityBadgeCluster> = {};
