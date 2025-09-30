import { type Meta, type StoryObj } from "@storybook/react";
import { RatingStars } from "./RatingStars";

const meta = {
  title: "Atoms/RatingStars",
  component: RatingStars,
  argTypes: {
    rating: { control: { type: "range", min: 0, max: 5, step: 0.5 } },
  },
  args: { rating: 3 },
} satisfies Meta<typeof RatingStars>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Primary = {} satisfies Story;
export const HalfStar = { args: { rating: 2.5 } } satisfies Story;
