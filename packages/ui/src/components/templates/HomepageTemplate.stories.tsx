import { type Meta, type StoryObj } from "@storybook/nextjs";
import { HomepageTemplate } from "./HomepageTemplate";

const meta: Meta<typeof HomepageTemplate> = {
  title: "Templates/HomepageTemplate",
  component: HomepageTemplate,
  args: {
    hero: "Hero section",
    recommendations: "Recommendations",
    children: "Main content",
  },
  argTypes: {
    hero: { control: "text" },
    recommendations: { control: "text" },
    children: { control: "text" },
  },
};
export default meta;

type Story = StoryObj<typeof HomepageTemplate>;
const baseArgs = meta.args!;

export const Default: Story = {};
export const Loading: Story = {
  args: { ...baseArgs },
  parameters: { dataState: "loading" },
};
export const Empty: Story = {
  args: { hero: "", recommendations: "", children: "" },
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
