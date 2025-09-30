import type { Meta, StoryObj } from "@storybook/react";
import { RatingSummary } from "./RatingSummary";

const meta = {
  title: "Molecules/RatingSummary",
  component: RatingSummary,
  tags: ["autodocs"],
  args: {
    rating: 4.3,
    count: 32,
  },
} satisfies Meta<typeof RatingSummary>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
