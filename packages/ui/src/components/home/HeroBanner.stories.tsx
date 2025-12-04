import { type Meta, type StoryObj } from "@storybook/nextjs";
import HeroBanner from "./HeroBanner.client";

const meta: Meta<typeof HeroBanner> = {
  title: "Home/HeroBanner/Minimal",
  component: HeroBanner,
  args: {},
};
export default meta;

export const Default: StoryObj<typeof HeroBanner> = {};
