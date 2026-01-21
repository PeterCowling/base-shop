import { type Meta, type StoryObj } from "@storybook/nextjs";

import { RatingStars } from "./RatingStars";

const meta: Meta<typeof RatingStars> = {
  title: "Atoms/RatingStars",
  component: RatingStars,
  argTypes: {
    rating: { control: { type: "range", min: 0, max: 5, step: 0.5 } },
  },
  args: { rating: 3 },
};
export default meta;

export const Primary: StoryObj<typeof RatingStars> = {};
export const HalfStar: StoryObj<typeof RatingStars> = { args: { rating: 2.5 } };

export const Default: StoryObj<typeof RatingStars> = {};
