import { type Meta, type StoryObj } from "@storybook/react";
import { RecommendationCarousel } from "./RecommendationCarousel";

const meta: Meta<typeof RecommendationCarousel> = {
  component: RecommendationCarousel,
  args: {
    endpoint: "/api/products",
    itemsPerSlide: 3,
  },
};
export default meta;

export const Default: StoryObj<typeof RecommendationCarousel> = {};
