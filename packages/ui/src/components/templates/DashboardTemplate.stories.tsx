import { type Meta, type StoryObj } from "@storybook/nextjs";
import { DashboardTemplate } from "./DashboardTemplate";

const meta: Meta<typeof DashboardTemplate> = {
  title: "Templates/DashboardTemplate",
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

type Story = StoryObj<typeof DashboardTemplate>;
const baseArgs = meta.args!;

export const Default: Story = {};
export const Loading: Story = {
  args: { ...baseArgs },
  parameters: { dataState: "loading" },
};
export const Empty: Story = {
  args: { stats: [] },
  parameters: { dataState: "empty" },
};
export const Error: Story = {
  args: { ...baseArgs },
  parameters: { dataState: "error" },
};
export const RTL: Story = {
  args: { ...baseArgs },
  parameters: { rtl: true },
};
