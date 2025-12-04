import { type Meta, type StoryObj } from "@storybook/nextjs";
import { RecommendationCarousel } from "./RecommendationCarousel";

const meta: Meta<typeof RecommendationCarousel> = {
  title: "Organisms/RecommendationCarousel",
  component: RecommendationCarousel,
  args: {
    endpoint: "/api/products",
    minItems: 1,
    maxItems: 4,
  },
};
export default meta;

export const Default: StoryObj<typeof RecommendationCarousel> = {};

export const Bounded: StoryObj<typeof RecommendationCarousel> = {
  args: { minItems: 2, maxItems: 2 },
};

export const Mobile: StoryObj<typeof RecommendationCarousel> = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

export const Responsive: StoryObj<typeof RecommendationCarousel> = {
  args: { desktopItems: 4, tabletItems: 2, mobileItems: 1 },
};
