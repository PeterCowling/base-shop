import { type Meta, type StoryObj } from "@storybook/nextjs";
import ReviewsCarousel from "./ReviewsCarousel";

const meta: Meta<typeof ReviewsCarousel> = {
  title: "Home/ReviewsCarousel",
  component: ReviewsCarousel,
  args: {},
};
export default meta;

export const Default: StoryObj<typeof ReviewsCarousel> = {};
