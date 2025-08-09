import { type Meta, type StoryObj } from "@storybook/react";
import { RecommendationCarousel } from "./RecommendationCarousel";

const meta: Meta<typeof RecommendationCarousel> = {
  component: RecommendationCarousel,
  args: {
    endpoint: "/api/products",
    minItemsPerSlide: 1,
    maxItemsPerSlide: 4,
  },
  argTypes: {
    minItemsPerSlide: { control: { type: "number" } },
    maxItemsPerSlide: { control: { type: "number" } },
  },
};
export default meta;

export const Default: StoryObj<typeof RecommendationCarousel> = {};
export const MinMax: StoryObj<typeof RecommendationCarousel> = {
  args: { minItemsPerSlide: 2, maxItemsPerSlide: 5 },
};
