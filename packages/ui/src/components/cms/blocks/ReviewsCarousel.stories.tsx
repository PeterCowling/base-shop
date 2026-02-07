import type { Meta, StoryObj } from "@storybook/nextjs";

import ReviewsCarousel from "./ReviewsCarousel";

const meta: Meta<typeof ReviewsCarousel> = {
  title: "CMS Blocks/ReviewsCarousel",
  component: ReviewsCarousel,
  args: {},
};
export default meta;

export const Default: StoryObj<typeof ReviewsCarousel> = {};
