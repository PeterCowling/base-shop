/* i18n-exempt file -- Storybook demo content uses literal strings */
import { type Meta, type StoryObj } from "@storybook/react";
import { ReviewsList } from "./ReviewsList";

const meta: Meta<typeof ReviewsList> = {
  component: ReviewsList,
  args: {
    reviews: [
      { author: "Alice", rating: 5, content: "Great product!" },
      { author: "Bob", rating: 4, content: "Works well" },
    ],
    filterable: true,
    minRating: 0,
    query: "",
  },
  argTypes: {
    onMinRatingChange: { action: "onMinRatingChange" },
    onQueryChange: { action: "onQueryChange" },
  },
};
export default meta;

export const Default: StoryObj<typeof ReviewsList> = {};
