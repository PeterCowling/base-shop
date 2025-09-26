import type { Meta, StoryObj } from "@storybook/react";
import ReviewsSection from "./ReviewsSection";

const meta: Meta<typeof ReviewsSection> = {
  component: ReviewsSection,
  args: {
    provider: "custom",
    items: [
      { id: "1", author: "Alex", rating: 5, title: "Great!", body: "Loved it.", createdAt: "2024-01-01" },
      { id: "2", author: "Sam", rating: 4, title: "Solid", body: "Would buy again.", createdAt: "2024-02-01" },
    ],
    showAggregate: true,
    emitJsonLd: false,
  },
};
export default meta;

export const Default: StoryObj<typeof ReviewsSection> = {};

