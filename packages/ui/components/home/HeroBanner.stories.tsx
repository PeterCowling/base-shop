import { type Meta, type StoryObj } from "@storybook/react";
import HeroBanner from "./HeroBanner";

const meta: Meta<typeof HeroBanner> = {
  component: HeroBanner,
  args: {},
};
export default meta;

export const Default: StoryObj<typeof HeroBanner> = {};
