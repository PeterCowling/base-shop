import { type Meta, type StoryObj } from "@storybook/react";
import ReviewsCarousel from "./ReviewsCarousel";

const meta = {
  component: ReviewsCarousel,
  args: {},
} satisfies Meta<typeof ReviewsCarousel>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
