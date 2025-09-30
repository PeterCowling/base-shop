import { type Meta, type StoryObj } from "@storybook/react";
import { StatsGrid } from "./StatsGrid";

const meta = {
  component: StatsGrid,
  args: {
    items: [
      { label: "Visits", value: 1200 },
      { label: "Purchases", value: 300 },
      { label: "Reviews", value: 80 },
    ],
  },
} satisfies Meta<typeof StatsGrid>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
