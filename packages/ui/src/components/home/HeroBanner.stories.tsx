import { type Meta, type StoryObj } from "@storybook/react";
import HeroBanner from "./HeroBanner.client";

const meta = {
  component: HeroBanner,
  args: {},
} satisfies Meta<typeof HeroBanner>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
