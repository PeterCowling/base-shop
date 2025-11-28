import { type Meta, type StoryObj } from "@storybook/nextjs";
import { StatsGrid } from "./StatsGrid";

const meta: Meta<typeof StatsGrid> = {
  component: StatsGrid,
  args: {
    items: [
      { label: "Visits", value: 1200 },
      { label: "Purchases", value: 300 },
      { label: "Reviews", value: 80 },
    ],
  },
};
export default meta;

export const Default: StoryObj<typeof StatsGrid> = {};
