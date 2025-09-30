import { type Meta, type StoryObj } from "@storybook/react";
import { HomepageTemplate } from "./HomepageTemplate";

const meta = {
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
} satisfies Meta<typeof HomepageTemplate>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
