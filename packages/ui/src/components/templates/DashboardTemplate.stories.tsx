import { type Meta, type StoryObj } from "@storybook/nextjs";
import { DashboardTemplate } from "./DashboardTemplate";

const meta: Meta<typeof DashboardTemplate> = {
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
};
export default meta;

export const Default: StoryObj<typeof DashboardTemplate> = {};
