import type { Meta, StoryObj } from "@storybook/react";
import RecommendationCarousel from "./RecommendationCarousel";

const meta = {
  component: RecommendationCarousel,
  args: { endpoint: "/api/products" },
} satisfies Meta<typeof RecommendationCarousel>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

export const Bounded = {
  args: { minItems: 2, maxItems: 4 },
} satisfies Story;

export const Responsive = {
  args: { desktopItems: 4, tabletItems: 2, mobileItems: 1 },
} satisfies Story;
