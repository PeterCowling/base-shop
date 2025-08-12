import type { Meta, StoryObj } from "@storybook/react";
import RecommendationCarousel from "./RecommendationCarousel";

const meta: Meta<typeof RecommendationCarousel> = {
  component: RecommendationCarousel,
  args: { endpoint: "/api/products" },
};
export default meta;

export const Default: StoryObj<typeof RecommendationCarousel> = {};

export const Bounded: StoryObj<typeof RecommendationCarousel> = {
  args: { minItems: 2, maxItems: 4 },
};

export const Responsive: StoryObj<typeof RecommendationCarousel> = {
  args: { desktopItems: 4, tabletItems: 2, mobileItems: 1 },
};
