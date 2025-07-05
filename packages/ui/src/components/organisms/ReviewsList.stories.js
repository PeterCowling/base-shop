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
};
export default meta;
export const Default = {};
