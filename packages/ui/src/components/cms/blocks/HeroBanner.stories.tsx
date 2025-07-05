import type { Meta, StoryObj } from "@storybook/react";
import HeroBanner from "./HeroBanner";

const meta: Meta<typeof HeroBanner> = {
  title: "CMS/Blocks/HeroBanner",
  component: HeroBanner,
  tags: ["autodocs"],
};
export default meta;

export const Default: StoryObj<typeof HeroBanner> = {};
