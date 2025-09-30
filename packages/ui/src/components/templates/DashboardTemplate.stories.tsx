import { type Meta, type StoryObj } from "@storybook/react";
import { DashboardTemplate } from "./DashboardTemplate";

const meta = {
  component: DashboardTemplate,
  args: {
    stats: [
      { label: "Users", value: 1000 },
      { label: "Orders", value: 250 },
    ],
  },
  argTypes: {
    stats: { control: "object" },
  },
} satisfies Meta<typeof DashboardTemplate>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
