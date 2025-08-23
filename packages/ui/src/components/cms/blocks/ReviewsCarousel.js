import { jsx as _jsx } from "react/jsx-runtime";
import ReviewsCarousel, {} from "../../home/ReviewsCarousel";
export default function CmsReviewsCarousel({ reviews = [], minItems, maxItems, }) {
    const list = reviews.slice(0, maxItems ?? reviews.length);
    if (!list.length || list.length < (minItems ?? 0))
        return null;
    return _jsx(ReviewsCarousel, { reviews: list });
}
