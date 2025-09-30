/* i18n-exempt file -- Storybook demo content uses literal strings */
import { type Meta, type StoryObj } from "@storybook/react";
import { ReviewsList } from "./ReviewsList";

const meta = {
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
} satisfies Meta<typeof ReviewsList>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
