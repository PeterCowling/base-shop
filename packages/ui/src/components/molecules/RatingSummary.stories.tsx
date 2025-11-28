import type { Meta, StoryObj } from "@storybook/nextjs";
import { RatingSummary } from "./RatingSummary";

const meta: Meta<typeof RatingSummary> = {
  title: "Molecules/RatingSummary",
  component: RatingSummary,
  tags: ["autodocs"],
  args: {
    rating: 4.3,
    count: 32,
  },
};
export default meta;

export const Default: StoryObj<typeof RatingSummary> = {};
