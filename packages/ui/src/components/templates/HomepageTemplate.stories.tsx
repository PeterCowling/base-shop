import { type Meta, type StoryObj } from "@storybook/nextjs";
import { HomepageTemplate } from "./HomepageTemplate";

const meta: Meta<typeof HomepageTemplate> = {
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

export const Default: StoryObj<typeof HomepageTemplate> = {};
