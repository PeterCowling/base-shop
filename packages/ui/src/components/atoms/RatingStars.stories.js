import { RatingStars } from "./RatingStars";
const meta = {
    title: "Atoms/RatingStars",
    component: RatingStars,
    argTypes: {
        rating: { control: { type: "range", min: 0, max: 5, step: 0.5 } },
    },
    args: { rating: 3 },
};
export default meta;
export const Primary = {};
export const HalfStar = { args: { rating: 2.5 } };
